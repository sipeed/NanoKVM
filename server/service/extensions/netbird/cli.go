package netbird

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"syscall"
	"time"
)

const (
	ScriptPath       = "/etc/init.d/S99netbird"
	ScriptBackupPath = "/kvmapp/system/init.d/S99netbird"
	PidFile          = "/var/run/netbird.pid"

	CommandTimeout   = 45 * time.Second
	CommandWaitDelay = 5 * time.Second
	LoginURLTimeout  = 60 * time.Second
	LoginStopTimeout = 5 * time.Second
)

type Cli struct{}

type NbStatus struct {
	FQDN          string `json:"fqdn"`
	IP            string `json:"netbirdIp"`
	DaemonVersion string `json:"daemonVersion"`

	Management struct {
		URL       string `json:"url"`
		Connected bool   `json:"connected"`
		Error     string `json:"error"`
	} `json:"management"`

	Signal struct {
		URL       string `json:"url"`
		Connected bool   `json:"connected"`
		Error     string `json:"error"`
	} `json:"signal"`
}

// NetBird's `up` command remains alive while the user completes browser
// authentication. Keep ownership after returning its URL: lifecycle actions
// can then cancel it before stopping/restarting the daemon, and a duplicate
// Login cannot race the first command.
type loginProcess struct {
	cmd  *exec.Cmd
	done chan struct{}
}

var activeLogin struct {
	sync.Mutex
	process *loginProcess
}

var loginURLRE = regexp.MustCompile(`https://\S+`)

func NewCli() *Cli {
	return &Cli{}
}

func (c *Cli) Start() error {
	if err := installInitScript(); err != nil {
		return err
	}
	return runProgram(CommandTimeout, ScriptPath, "start")
}

func (c *Cli) Restart() error {
	// A restart script stops the live daemon before it starts a replacement.
	// Check every static start prerequisite first, so a damaged installation
	// cannot turn a recoverable connection into an outage.
	if err := c.CanRestart(); err != nil {
		return err
	}
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active netbird login: %w", err)
	}
	if err := installInitScript(); err != nil {
		return err
	}
	return runProgram(CommandTimeout, ScriptPath, "restart")
}

// CanResume checks the static prerequisites for resuming the daemon after a
// failed preference update. SetPreference calls it before stopping the old
// tunnel: a rollback that is already known to be impossible is not a safe
// rollback at all.
func (c *Cli) CanResume() error {
	// Resume is a start path used only for preference-write rollback. Like
	// every other start path it requires an attested install, and like every
	// other start path it does not require that install to be the pinned
	// release: refusing to resume an older client would leave the device with
	// the tunnel this rollback exists to restore still down.
	return canResume(NetbirdPath, ScriptPath, getInstalledVersion())
}

// CanRestart verifies the pieces Restart needs before its init script can
// stop a live daemon. The backup script is copied atomically by Restart, so it
// need only be a regular file; the binary itself must already be executable.
func (c *Cli) CanRestart() error {
	return canRestart(NetbirdPath, ScriptBackupPath, getInstalledVersion())
}

func canResume(binaryPath, scriptPath, installedVersion string) error {
	if !isExecutable(binaryPath) {
		return fmt.Errorf("no usable netbird binary at %s", binaryPath)
	}
	if !installAttested(installedVersion) {
		return errNetbirdNotAttested
	}
	if !isExecutable(scriptPath) {
		return fmt.Errorf("no usable init script at %s", scriptPath)
	}
	return nil
}

func canRestart(binaryPath, backupScriptPath, installedVersion string) error {
	if !isExecutable(binaryPath) {
		return fmt.Errorf("no usable netbird binary at %s", binaryPath)
	}
	if !installAttested(installedVersion) {
		return errNetbirdNotAttested
	}
	if !isRegularFile(backupScriptPath) {
		return fmt.Errorf("no usable recovery init script at %s", backupScriptPath)
	}
	return nil
}

// Resume starts from the existing init script only. It is used to roll back a
// failed preference write and intentionally does not copy a script first.
func (c *Cli) Resume() error {
	if err := c.CanResume(); err != nil {
		return err
	}
	return runProgram(CommandTimeout, ScriptPath, "start")
}

// StopRuntime leaves S99 in place. Unlike a boot preference, runtime state is
// reversible, and SetPreference needs that reversibility until its atomic
// preference rename has succeeded.
func (c *Cli) StopRuntime() error {
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active netbird login: %w", err)
	}

	script, err := stopScript()
	if err != nil || script == "" {
		return err
	}
	return runProgram(CommandTimeout, script, "stop")
}

// Stop is a runtime-only action for NetBird; the boot preference remains the
// authority for the next reboot.
func (c *Cli) Stop() error {
	return c.StopRuntime()
}

func (c *Cli) WaitForSocket(timeout time.Duration) error {
	socketPath := "/var/run/netbird.sock"
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		info, err := os.Stat(socketPath)
		if err == nil && info.Mode()&os.ModeSocket != 0 {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("netbird daemon socket not ready after %s", timeout)
}

func (c *Cli) Login() (string, error) {
	// `netbird up` can bring a tunnel up. Keep the check at the CLI boundary
	// too, so callers cannot bypass Service.Login's lifecycle policy.
	if !installAttested(getInstalledVersion()) {
		return "", errNetbirdNotAttested
	}
	if err := c.WaitForSocket(10 * time.Second); err != nil {
		return "", err
	}

	cmd := exec.Command(NetbirdPath, "up", "--daemon-addr", "unix:///var/run/netbird.sock", "--no-browser")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", err
	}
	process, err := startLogin(cmd)
	if err != nil {
		return "", err
	}

	urlCh := make(chan string, 1)
	var readers sync.WaitGroup
	readers.Add(2)
	go scanLoginURL(bufio.NewReader(stdout), urlCh, &readers)
	go scanLoginURL(bufio.NewReader(stderr), urlCh, &readers)

	result := make(chan error, 1)
	go func() {
		readers.Wait()
		err := cmd.Wait()
		finishLogin(process)
		result <- err
		close(process.done)
	}()

	select {
	case url := <-urlCh:
		return url, nil
	case err := <-result:
		if err == nil {
			return "", nil // already authenticated
		}
		return "", fmt.Errorf("netbird up failed: %w", err)
	case <-time.After(LoginURLTimeout):
		_ = stopLogin(process)
		return "", fmt.Errorf("timed out waiting for netbird login URL")
	}
}

func (c *Cli) Down() error {
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active netbird login: %w", err)
	}
	return runProgram(CommandTimeout, NetbirdPath, "down", "--daemon-addr", "unix:///var/run/netbird.sock")
}

// Status is retained for package callers. Unlike the old implementation it
// never restarts the service: status reads are strictly observational.
func (c *Cli) Status() (*NbStatus, error) {
	return c.StatusOnly()
}

func (c *Cli) StatusOnly() (*NbStatus, error) {
	output, err := runProgramOutput(CommandTimeout, NetbirdPath, "status", "--json", "--daemon-addr", "unix:///var/run/netbird.sock")
	status, parseErr := parseStatus(output)
	if parseErr == nil {
		// Some NetBird versions use a non-zero exit code for a disconnected
		// daemon while still printing a complete JSON observation. The parsed
		// object is authoritative; an unparseable timeout/diagnostic is not.
		return status, nil
	}
	if err != nil {
		return nil, err
	}
	return nil, parseErr
}

func parseStatus(output string) (*NbStatus, error) {
	output = normalizeJSON(output)
	if output == "" {
		return nil, fmt.Errorf("invalid netbird status output")
	}

	var status NbStatus
	if err := json.Unmarshal([]byte(output), &status); err != nil {
		return nil, fmt.Errorf("parse netbird status: %w", err)
	}
	return &status, nil
}

func (c *Cli) ServiceRunning() (bool, error) {
	return daemonPresent()
}

func installInitScript() error {
	contents, err := os.ReadFile(ScriptBackupPath)
	if err != nil {
		return fmt.Errorf("read netbird init script: %w", err)
	}
	return replaceInitScript(ScriptPath, contents, "netbird")
}

// The installed init script is part of the recovery path. Publish a complete,
// executable replacement with rename rather than truncating S99 in place.
func replaceInitScript(path string, contents []byte, client string) error {
	directory := filepath.Dir(path)
	temporary, err := os.CreateTemp(directory, "."+client+".init-")
	if err != nil {
		return fmt.Errorf("create %s init script: %w", client, err)
	}
	temporaryPath := temporary.Name()
	defer func() { _ = os.Remove(temporaryPath) }()

	if err := temporary.Chmod(0o755); err != nil {
		_ = temporary.Close()
		return fmt.Errorf("chmod %s init script: %w", client, err)
	}
	if _, err := temporary.Write(contents); err != nil {
		_ = temporary.Close()
		return fmt.Errorf("write %s init script: %w", client, err)
	}
	if err := temporary.Sync(); err != nil {
		_ = temporary.Close()
		return fmt.Errorf("sync %s init script: %w", client, err)
	}
	if err := temporary.Close(); err != nil {
		return fmt.Errorf("close %s init script: %w", client, err)
	}
	if err := os.Rename(temporaryPath, path); err != nil {
		return fmt.Errorf("replace %s init script: %w", client, err)
	}
	if dir, err := os.Open(directory); err == nil {
		_ = dir.Sync()
		_ = dir.Close()
	}
	return nil
}

func stopScript() (string, error) {
	for _, script := range []string{ScriptBackupPath, ScriptPath} {
		if isExecutable(script) {
			return script, nil
		}
	}

	running, err := daemonPresent()
	if err != nil {
		return "", err
	}
	if running {
		return "", errors.New("netbird is running but no usable init script is available to stop it")
	}
	return "", nil
}

func isExecutable(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular() && info.Mode()&0o111 != 0
}

// daemonPresent uses /proc/exe to reject stale/recycled PID-file entries and
// unrelated processes named netbird. The deleted-executable spelling is still
// a live daemon and must block unsafe uninstall/switch operations.
func daemonPresent() (bool, error) {
	executable, err := canonicalDaemonPath(NetbirdPath)
	if err != nil {
		return false, fmt.Errorf("resolve netbird executable: %w", err)
	}
	output, err := exec.Command("pidof", daemonProcessNames(NetbirdPath, executable)...).Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
			return false, nil
		}
		return false, fmt.Errorf("find netbird process: %w", err)
	}
	for _, pid := range strings.Fields(string(output)) {
		target, err := os.Readlink("/proc/" + pid + "/exe")
		if err != nil {
			if processInspectionGone(err) {
				continue // process exited between pidof and inspection
			}
			return false, fmt.Errorf("inspect netbird process %s executable: %w", pid, err)
		}
		if daemonTargetMatches(target, executable) {
			running, err := isNetbirdDaemonPID(pid)
			if err != nil {
				return false, err
			}
			if running {
				return true, nil
			}
		}
	}
	return false, nil
}

// NetBird uses the same executable for daemon and client commands. Checking
// /proc/exe alone would mistake a concurrent `netbird status` or `netbird up`
// for the daemon; only `netbird service run` owns S99's process lifecycle.
func isNetbirdDaemonPID(pid string) (bool, error) {
	cmdline, err := os.ReadFile("/proc/" + pid + "/cmdline")
	if err != nil {
		if processInspectionGone(err) {
			return false, nil // process exited after /proc/<pid>/exe was read
		}
		return false, fmt.Errorf("inspect netbird process %s command line: %w", pid, err)
	}
	return isNetbirdDaemonCommand(cmdline), nil
}

// processInspectionGone is deliberately narrow: pidof can race a process exit,
// but an unreadable /proc entry is not evidence that the daemon is absent.
// Callers use this probe to decide whether it is safe to replace or stop VPN
// state, so permission and I/O failures must be handled conservatively.
func processInspectionGone(err error) bool {
	return errors.Is(err, os.ErrNotExist) || errors.Is(err, syscall.ESRCH)
}

func isNetbirdDaemonCommand(cmdline []byte) bool {
	args := bytes.Split(bytes.TrimRight(cmdline, "\x00"), []byte{0})
	return len(args) >= 3 && string(args[1]) == "service" && string(args[2]) == "run"
}

func runProgram(timeout time.Duration, name string, args ...string) error {
	_, err := runProgramOutput(timeout, name, args...)
	return err
}

// Commands are invoked directly, never through `sh -c`, in their own process
// group. An init script can fork a daemon which inherits stdout/stderr. Killing
// only the script makes Cmd.Wait wait indefinitely for that descendant to close
// the inherited pipes, while the caller still holds the VPN lifecycle lock.
// The Linux cancellation hook kills the complete group; WaitDelay also bounds
// pipe cleanup if a descendant deliberately escapes that group.
func runProgramOutput(timeout time.Duration, name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, name, args...)
	configureProgramCommand(cmd)
	cmd.WaitDelay = CommandWaitDelay
	output, err := cmd.CombinedOutput()
	text := strings.TrimSpace(string(output))
	if ctx.Err() == context.DeadlineExceeded {
		return text, fmt.Errorf("%s timed out after %s: %w", name, timeout, context.DeadlineExceeded)
	}
	return commandResult(string(output), err)
}

const maxDaemonSymlinkHops = 40

// canonicalDaemonPath resolves a configured executable alias into the pathname
// the kernel reports through /proc/<pid>/exe. It intentionally permits a
// missing final leaf: a daemon may still be running from an unlinked inode and
// /proc then appends " (deleted)". filepath.EvalSymlinks alone cannot express
// that safe stop/uninstall case for a symlink whose target was removed.
func canonicalDaemonPath(executable string) (string, error) {
	path, err := filepath.Abs(executable)
	if err != nil {
		return "", err
	}
	path = filepath.Clean(path)
	for hop := 0; ; hop++ {
		info, err := os.Lstat(path)
		if err != nil {
			if os.IsNotExist(err) {
				return canonicalDaemonParent(path)
			}
			return "", err
		}
		if info.Mode()&os.ModeSymlink == 0 {
			if resolved, err := filepath.EvalSymlinks(path); err == nil {
				return resolved, nil
			}
			return canonicalDaemonParent(path)
		}
		if hop >= maxDaemonSymlinkHops {
			return "", fmt.Errorf("too many symbolic links resolving %s", executable)
		}
		target, err := os.Readlink(path)
		if err != nil {
			return "", err
		}
		if !filepath.IsAbs(target) {
			target = filepath.Join(filepath.Dir(path), target)
		}
		path = filepath.Clean(target)
	}
}

// canonicalDaemonParent resolves all existing directory components while
// retaining the final component verbatim when it has been unlinked.
func canonicalDaemonParent(path string) (string, error) {
	parent, err := filepath.EvalSymlinks(filepath.Dir(path))
	if err != nil {
		return "", err
	}
	return filepath.Join(parent, filepath.Base(path)), nil
}

func daemonTargetMatches(target, executable string) bool {
	return target == executable || target == executable+" (deleted)"
}

// daemonProcessNames covers both ways a daemon can have been started. Linux
// preserves the invoked alias in the process name used by pidof, while
// /proc/<pid>/exe resolves that alias to the canonical target. Including the
// target basename also finds a daemon launched directly from that target. The
// latter check remains mandatory before treating either candidate as NetBird.
func daemonProcessNames(alias, executable string) []string {
	aliasName := filepath.Base(alias)
	targetName := filepath.Base(executable)
	if aliasName == targetName {
		return []string{aliasName}
	}
	return []string{aliasName, targetName}
}

func commandResult(output string, err error) (string, error) {
	text := strings.TrimSpace(output)
	if err != nil {
		if text == "" {
			return text, err
		}
		return text, fmt.Errorf("%w: %s", err, text)
	}
	return text, nil
}

func normalizeJSON(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "{") {
		return s
	}
	index := strings.Index(s, "{")
	if index == -1 {
		return ""
	}
	return strings.TrimSpace(s[index:])
}

func startLogin(cmd *exec.Cmd) (*loginProcess, error) {
	activeLogin.Lock()
	defer activeLogin.Unlock()
	if activeLogin.process != nil {
		return nil, errors.New("netbird login is already in progress")
	}
	configureLoginCommand(cmd)
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	process := &loginProcess{cmd: cmd, done: make(chan struct{})}
	activeLogin.process = process
	return process, nil
}

func finishLogin(process *loginProcess) {
	activeLogin.Lock()
	if activeLogin.process == process {
		activeLogin.process = nil
	}
	activeLogin.Unlock()
}

func cancelLogin() error {
	activeLogin.Lock()
	process := activeLogin.process
	activeLogin.Unlock()
	if process == nil {
		return nil
	}
	return stopLogin(process)
}

func stopLogin(process *loginProcess) error {
	if err := killLoginCommand(process.cmd); err != nil && !errors.Is(err, os.ErrProcessDone) {
		return err
	}
	select {
	case <-process.done:
		return nil
	case <-time.After(LoginStopTimeout):
		return fmt.Errorf("netbird login did not terminate within %s", LoginStopTimeout)
	}
}

func scanLoginURL(reader *bufio.Reader, urls chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	sent := false
	for {
		line, err := reader.ReadString('\n')
		if !sent {
			if url := loginURLRE.FindString(line); url != "" {
				select {
				case urls <- url:
				default:
				}
				sent = true
			}
		}
		if err != nil {
			return
		}
	}
}

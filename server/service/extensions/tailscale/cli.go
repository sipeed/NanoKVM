package tailscale

import (
	"NanoKVM-Server/utils"
	"bufio"
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
	ScriptPath       = "/etc/init.d/S98tailscaled"
	ScriptBackupPath = "/kvmapp/system/init.d/S98tailscaled"
)

// All synchronous lifecycle calls must finish before the browser's normal
// request timeout. Login is intentionally different: it is an interactive,
// long-running operation and is owned/cancelled separately below.
const (
	UpTimeout        = 45 * time.Second
	DownTimeout      = 45 * time.Second
	StatusTimeout    = 10 * time.Second
	ScriptTimeout    = 45 * time.Second
	CommandWaitDelay = 5 * time.Second
	LoginURLTimeout  = 60 * time.Second
	LoginStopTimeout = 5 * time.Second
)

type Cli struct{}

type TsStatus struct {
	BackendState string `json:"BackendState"`

	Self struct {
		HostName     string   `json:"HostName"`
		TailscaleIPs []string `json:"TailscaleIPs"`
	} `json:"Self"`

	CurrentTailnet struct {
		Name string `json:"Name"`
	} `json:"CurrentTailnet"`
}

// An interactive `tailscale login` must not be detached from the server. The
// HTTP request returns as soon as it gets the URL, but a subsequent Stop, Down,
// Logout, Restart or Uninstall has to cancel the still-running CLI before it
// changes daemon state. Only one login may own the client at a time.
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
	if err := c.prepareStart(); err != nil {
		return err
	}

	if err := installInitScript(); err != nil {
		return err
	}
	return runProgram(ScriptTimeout, ScriptPath, "start")
}

func (c *Cli) Restart() error {
	// The init script's restart action stops tailscaled before launching it
	// again. Establish that its binaries and recovery script are usable before
	// invoking that destructive action.
	if err := c.prepareStart(); err != nil {
		return err
	}
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active tailscale login: %w", err)
	}
	if err := installInitScript(); err != nil {
		return err
	}
	return runProgram(ScriptTimeout, ScriptPath, "restart")
}

// CanResume checks the immutable prerequisites of the rollback start path.
// Unlike Start/Restart, Resume intentionally does not chmod or replace files:
// a failed preference write must not silently alter boot configuration.
func (c *Cli) CanResume() error {
	return canResume(TailscalePath, TailscaledPath, ScriptPath)
}

func canResume(tailscalePath, tailscaledPath, scriptPath string) error {
	for _, path := range []string{tailscalePath, tailscaledPath, scriptPath} {
		if !isExecutable(path) {
			return fmt.Errorf("no usable executable at %s", path)
		}
	}
	return nil
}

// prepareStart verifies regular executable artifacts before a restart can stop
// the live daemon. Start retains its historical recovery behavior of restoring
// the owner execute bit, but never applies that bit to a directory or another
// non-regular filesystem object.
func (c *Cli) prepareStart() error {
	for _, filePath := range []string{TailscalePath, TailscaledPath} {
		info, err := os.Stat(filePath)
		if err != nil {
			return fmt.Errorf("inspect tailscale executable %s: %w", filePath, err)
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("tailscale executable %s is not a regular file", filePath)
		}
		if err := utils.EnsurePermission(filePath, 0o100); err != nil {
			return fmt.Errorf("make tailscale executable %s: %w", filePath, err)
		}
	}
	if !isRegularFile(ScriptBackupPath) {
		return fmt.Errorf("no usable recovery init script at %s", ScriptBackupPath)
	}
	return nil
}

// Resume starts the client from the init script already on disk. It is used by
// SetPreference rollback and deliberately does not copy the firmware script:
// a read-only filesystem must make the rollback fail explicitly, rather than
// silently changing the boot configuration.
func (c *Cli) Resume() error {
	if !isExecutable(ScriptPath) {
		return fmt.Errorf("no init script at %s to resume from", ScriptPath)
	}
	return runProgram(UpTimeout, ScriptPath, "start")
}

// StopRuntime stops the daemon but preserves S98. Switching VPNs uses this
// operation so a failed atomic preference write can resume the old daemon.
func (c *Cli) StopRuntime() error {
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active tailscale login: %w", err)
	}

	script, err := stopScript("tailscaled", TailscaledPath)
	if err != nil || script == "" {
		return err
	}
	return runProgram(ScriptTimeout, script, "stop")
}

// Stop is the explicit UI action that also disables Tailscale autostart. It
// only removes S98 after StopRuntime has confirmed that the script succeeded.
func (c *Cli) Stop() error {
	if err := c.StopRuntime(); err != nil {
		return err
	}
	if err := os.Remove(ScriptPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove tailscale init script: %w", err)
	}
	return nil
}

// netfilterMode keeps tailscaled out of iptables. With its default ("on") it
// installs `-A ts-input -s 100.64.0.0/10 ! -i tailscale0 -j DROP`: anti-spoofing
// that assumes the whole CGNAT range belongs to Tailscale. NetBird allocates from
// the same range, so that rule drops every packet NetBird delivers on wt0 — the
// device stays "Connected" in NetBird while nothing reaches it. Measured on a
// Cube: starting tailscaled cut all inbound NetBird traffic, and removing that
// one rule restored it.
//
// The rule protects little here. NanoKVM routes nothing, INPUT's policy is
// ACCEPT, and the web UI and SSH are reachable from the LAN regardless, so a
// spoofed 100.x source gains nothing it did not already have.
//
// Every command that writes preferences has to carry it. `tailscale up` refuses
// to run unless it mentions every non-default setting, so once "off" is stored,
// an `up` without it fails; `tailscale login` would otherwise apply the default.
const netfilterMode = "--netfilter-mode=off"

func (c *Cli) Up() error {
	if err := runProgram(UpTimeout, TailscalePath, "up", "--accept-dns=false", netfilterMode); err != nil {
		return fmt.Errorf("tailscale up: %w", err)
	}
	return nil
}

func (c *Cli) Down() error {
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active tailscale login: %w", err)
	}
	return runProgram(DownTimeout, TailscalePath, "down")
}

func (c *Cli) Status() (*TsStatus, error) {
	output, err := runProgramOutput(StatusTimeout, TailscalePath, "status", "--json")
	if err != nil {
		return nil, err
	}

	// Some old CLI versions prefix JSON with a warning.
	if outputStr := strings.TrimSpace(output); !strings.HasPrefix(outputStr, "{") {
		index := strings.Index(outputStr, "{")
		if index == -1 {
			return nil, errors.New("unknown tailscale status output")
		}
		output = outputStr[index:]
	}

	var status TsStatus
	if err := json.Unmarshal([]byte(output), &status); err != nil {
		return nil, err
	}
	return &status, nil
}

func (c *Cli) Login() (string, error) {
	cmd := exec.Command(TailscalePath, "login", "--accept-dns=false", netfilterMode, "--timeout=10m")
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
		return "", fmt.Errorf("tailscale login failed: %w", err)
	case <-time.After(LoginURLTimeout):
		_ = stopLogin(process)
		return "", fmt.Errorf("timed out waiting for tailscale login URL")
	}
}

func (c *Cli) Logout() error {
	if err := cancelLogin(); err != nil {
		return fmt.Errorf("cancel active tailscale login: %w", err)
	}
	return runProgram(DownTimeout, TailscalePath, "logout")
}

func installInitScript() error {
	contents, err := os.ReadFile(ScriptBackupPath)
	if err != nil {
		return fmt.Errorf("read tailscale init script: %w", err)
	}
	return replaceInitScript(ScriptPath, contents, "tailscale")
}

// replaceInitScript avoids leaving a truncated S98 after an interrupted copy.
// The init script is the recovery path for a remote device, so replacing it is
// a small filesystem transaction just like the VPN preference file.
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

// stopScript returns a usable stop script even when the installed init script
// was deleted. The firmware backup is executable in place and does not restore
// S98, preserving the distinction between stopping runtime and autostart.
func stopScript(processName, executable string) (string, error) {
	for _, script := range []string{ScriptBackupPath, ScriptPath} {
		if isExecutable(script) {
			return script, nil
		}
	}

	running, err := daemonPresent(processName, executable)
	if err != nil {
		return "", err
	}
	if running {
		return "", fmt.Errorf("%s is running but no usable init script is available to stop it", processName)
	}
	return "", nil
}

func isExecutable(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular() && info.Mode()&0o111 != 0
}

func isRegularFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular()
}

// daemonPresentForService is a narrow seam for the daemon-identity probe.  It
// keeps ServiceRunning deterministic to test without weakening the production
// check, which remains daemonPresent's pidof + /proc/<pid>/exe verification.
var daemonPresentForService = daemonPresent

// ServiceRunning reports whether a real tailscaled daemon is present. It does
// not use `tailscale status`: that command can fail while the daemon remains
// alive (for example while its local socket is transiently unavailable).
//
// The result is based on the same /proc executable identity check used by the
// stop/uninstall recovery path, so a stale PID or unrelated process cannot be
// mistaken for tailscaled.
func (c *Cli) ServiceRunning() (bool, error) {
	return daemonPresentForService("tailscaled", TailscaledPath)
}

// daemonPresent verifies the executable via /proc rather than trusting a stale
// pid file or a process with the same name. A removed executable remains
// visible as "<path> (deleted)", which still has to block unsafe removal.
func daemonPresent(name, executable string) (bool, error) {
	canonicalExecutable, err := canonicalDaemonPath(executable)
	if err != nil {
		return false, fmt.Errorf("resolve %s executable: %w", name, err)
	}
	output, err := exec.Command("pidof", daemonProcessNames(executable, canonicalExecutable)...).Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
			return false, nil
		}
		return false, fmt.Errorf("find %s process: %w", name, err)
	}
	for _, pid := range strings.Fields(string(output)) {
		target, err := os.Readlink("/proc/" + pid + "/exe")
		if err != nil {
			if processInspectionGone(err) {
				continue // exited between pidof and inspection
			}
			return false, fmt.Errorf("inspect %s process %s executable: %w", name, pid, err)
		}
		if daemonTargetMatches(target, canonicalExecutable) {
			return true, nil
		}
	}
	return false, nil
}

// processInspectionGone is deliberately narrow: pidof can race a process exit,
// but an unreadable /proc entry is not evidence that the daemon is absent.
// Callers use this probe to decide whether it is safe to replace or stop VPN
// state, so permission and I/O failures must be handled conservatively.
func processInspectionGone(err error) bool {
	return errors.Is(err, os.ErrNotExist) || errors.Is(err, syscall.ESRCH)
}

func runProgram(timeout time.Duration, name string, args ...string) error {
	_, err := runProgramOutput(timeout, name, args...)
	return err
}

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
// reported by /proc/<pid>/exe. A missing final leaf is preserved because a live
// daemon can keep an unlinked executable mapped and /proc marks it " (deleted)".
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

// daemonProcessNames accounts for Linux retaining the invoked symlink alias
// as the process name pidof sees, while /proc/<pid>/exe resolves it to the
// canonical executable. Searching both names also covers a daemon launched
// directly from its target; /proc identity validation rejects lookalikes.
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

func startLogin(cmd *exec.Cmd) (*loginProcess, error) {
	activeLogin.Lock()
	defer activeLogin.Unlock()
	if activeLogin.process != nil {
		return nil, errors.New("tailscale login is already in progress")
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
		return fmt.Errorf("tailscale login did not terminate within %s", LoginStopTimeout)
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

package netbird

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

const (
	ScriptPath       = "/etc/init.d/S99netbird"
	ScriptBackupPath = "/kvmapp/system/init.d/S99netbird"
	CommandTimeout   = 1 * time.Minute
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

func NewCli() *Cli {
	return &Cli{}
}

func (c *Cli) Start() error {
	commands := []string{
		fmt.Sprintf("cp -f %s %s", ScriptBackupPath, ScriptPath),
		fmt.Sprintf("chmod 755 %s", ScriptPath),
		fmt.Sprintf("%s start", ScriptPath),
	}
	return runCommand(strings.Join(commands, " && "), false)
}

func (c *Cli) Restart() error {
	commands := []string{
		fmt.Sprintf("cp -f %s %s", ScriptBackupPath, ScriptPath),
		fmt.Sprintf("chmod 755 %s", ScriptPath),
		fmt.Sprintf("%s restart", ScriptPath),
	}
	return runCommand(strings.Join(commands, " && "), false)
}

func (c *Cli) Stop() error {
	return runCommand(fmt.Sprintf("%s stop", ScriptPath), false)
}

func (c *Cli) WaitForSocket(timeout time.Duration) error {
	socketPath := "/var/run/netbird.sock"
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if _, err := exec.Command("sh", "-c", "test -S "+socketPath).Output(); err == nil {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("netbird daemon socket not ready after %s", timeout)
}

func (c *Cli) Login() (string, error) {
	if err := c.WaitForSocket(10 * time.Second); err != nil {
		return "", err
	}

	command := "netbird up --daemon-addr unix:///var/run/netbird.sock --no-browser"
	cmd := exec.Command("sh", "-c", command)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", err
	}

	if err := cmd.Start(); err != nil {
		return "", err
	}

	urlRe := regexp.MustCompile(`https://\S+`)
	urlCh := make(chan string, 1)

	scanForURL := func(r *bufio.Reader) {
		for {
			line, err := r.ReadString('\n')
			if match := urlRe.FindString(line); match != "" {
				select {
				case urlCh <- match:
				default:
				}
				return
			}
			if err != nil {
				return
			}
		}
	}

	go scanForURL(bufio.NewReader(stdout))
	go scanForURL(bufio.NewReader(stderr))

	// Wait for URL or command to finish
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()

	select {
	case url := <-urlCh:
		return url, nil
	case err := <-done:
		// Command finished without producing a URL — already logged in
		if err == nil {
			return "", nil
		}
		return "", fmt.Errorf("netbird up failed: %w", err)
	case <-time.After(60 * time.Second):
		_ = cmd.Process.Kill()
		return "", fmt.Errorf("timed out waiting for login URL")
	}
}

func (c *Cli) Down() error {
	return runCommand("netbird down --daemon-addr unix:///var/run/netbird.sock", true)
}

func (c *Cli) Status() (*NbStatus, error) {
	output, err := runCommandWithOutput("netbird status --json --daemon-addr unix:///var/run/netbird.sock", true)
	if err != nil {
		return nil, err
	}

	output = normalizeJSON(output)
	if output == "" {
		return nil, fmt.Errorf("invalid netbird status output")
	}

	var status NbStatus
	if err := json.Unmarshal([]byte(output), &status); err != nil {
		return nil, fmt.Errorf("parse status failed: %w", err)
	}

	return &status, nil
}

func (c *Cli) ServiceRunning() (bool, error) {
	output, err := runCommandWithOutput(fmt.Sprintf("%s status", ScriptPath), false)
	if err == nil {
		return strings.Contains(strings.ToLower(output), "running"), nil
	}

	lower := strings.ToLower(output)
	if strings.Contains(lower, "not running") || strings.Contains(lower, "stopped") {
		return false, nil
	}

	return false, err
}

func runCommand(command string, restartOnTimeout bool) error {
	_, err := runCommandWithOutput(command, restartOnTimeout)
	return err
}

func runCommandWithOutput(command string, restartOnTimeout bool) (string, error) {
	output, err, timedOut := runCommandWithTimeout(command, CommandTimeout)
	if err == nil {
		return output, nil
	}

	if !timedOut || !restartOnTimeout {
		return output, err
	}

	restartCommand := fmt.Sprintf("%s restart", ScriptPath)
	restartOutput, restartErr, _ := runCommandWithTimeout(restartCommand, CommandTimeout)
	if restartErr != nil {
		return output, fmt.Errorf("command timed out, restart failed: %w", combineCommandError(restartErr, restartOutput))
	}

	retryOutput, retryErr, _ := runCommandWithTimeout(command, CommandTimeout)
	if retryErr != nil {
		return retryOutput, fmt.Errorf("command timed out, restart succeeded, retry failed: %w", combineCommandError(retryErr, retryOutput))
	}

	return retryOutput, nil
}

func runCommandWithTimeout(command string, timeout time.Duration) (string, error, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "sh", "-c", command)
	output, err := cmd.CombinedOutput()
	msg := strings.TrimSpace(string(output))
	if err == nil {
		return msg, nil, false
	}

	if ctx.Err() == context.DeadlineExceeded {
		timeoutErr := fmt.Errorf("command timed out after %s", timeout)
		return msg, combineCommandError(timeoutErr, msg), true
	}

	return msg, combineCommandError(err, msg), false
}

func combineCommandError(err error, output string) error {
	msg := strings.TrimSpace(output)
	if msg == "" {
		return err
	}

	return fmt.Errorf("%w: %s", err, msg)
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

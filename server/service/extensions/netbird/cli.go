package netbird

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
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

func (c *Cli) Up(setupKey string, managementURL string, adminURL string) error {
	command := fmt.Sprintf(
		"netbird up --setup-key %s --management-url %s --daemon-addr unix:///var/run/netbird.sock --no-browser",
		shellQuote(setupKey),
		shellQuote(managementURL),
	)

	if adminURL != "" {
		command = fmt.Sprintf("%s --admin-url %s", command, shellQuote(adminURL))
	}

	return runCommand(command, true)
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

func shellQuote(v string) string {
	return "'" + strings.ReplaceAll(v, "'", "'\"'\"'") + "'"
}

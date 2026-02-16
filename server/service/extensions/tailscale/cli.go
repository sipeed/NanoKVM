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
	"regexp"
	"strings"
	"time"
)

const (
	ScriptPath       = "/etc/init.d/S98tailscaled"
	ScriptBackupPath = "/kvmapp/system/init.d/S98tailscaled"
	CommandTimeout   = 1 * time.Minute
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

func NewCli() *Cli {
	return &Cli{}
}

func (c *Cli) Start() error {
	for _, filePath := range []string{TailscalePath, TailscaledPath} {
		if err := utils.EnsurePermission(filePath, 0o100); err != nil {
			return err
		}
	}

	commands := []string{
		fmt.Sprintf("cp -f %s %s", ScriptBackupPath, ScriptPath),
		fmt.Sprintf("%s start", ScriptPath),
	}

	command := strings.Join(commands, " && ")
	return runCommand(command, false)
}

func (c *Cli) Restart() error {
	commands := []string{
		fmt.Sprintf("cp -f %s %s", ScriptBackupPath, ScriptPath),
		fmt.Sprintf("%s restart", ScriptPath),
	}

	command := strings.Join(commands, " && ")
	return runCommand(command, false)
}

func (c *Cli) Stop() error {
	command := fmt.Sprintf("%s stop", ScriptPath)
	err := runCommand(command, false)
	if err != nil {
		return err
	}

	return os.Remove(ScriptPath)
}

func (c *Cli) Up() error {
	command := "tailscale up --accept-dns=false"
	return runCommand(command, true)
}

func (c *Cli) Down() error {
	command := "tailscale down"
	return runCommand(command, true)
}

func (c *Cli) Status() (*TsStatus, error) {
	command := "tailscale status --json"
	output, err := runCommandWithOutput(command, true)
	if err != nil {
		return nil, err
	}

	// output is not in standard json format
	if outputStr := string(output); !strings.HasPrefix(outputStr, "{") {
		index := strings.Index(outputStr, "{")
		if index == -1 {
			return nil, errors.New("unknown output")
		}

		output = []byte(outputStr[index:])
	}

	var status TsStatus
	err = json.Unmarshal(output, &status)
	if err != nil {
		return nil, err
	}

	return &status, nil
}

func (c *Cli) Login() (string, error) {
	command := "tailscale login --accept-dns=false --timeout=10m"
	cmd := exec.Command("sh", "-c", command)

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", err
	}
	defer func() {
		_ = stderr.Close()
	}()

	go func() {
		_ = cmd.Run()
	}()

	reader := bufio.NewReader(stderr)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			return "", err
		}

		if strings.Contains(line, "https") {
			reg := regexp.MustCompile(`\s+`)
			url := reg.ReplaceAllString(line, "")
			return url, nil
		}
	}
}

func (c *Cli) Logout() error {
	command := "tailscale logout"
	return runCommand(command, true)
}

func runCommand(command string, restartOnTimeout bool) error {
	_, err := runCommandWithOutput(command, restartOnTimeout)
	return err
}

func runCommandWithOutput(command string, restartOnTimeout bool) ([]byte, error) {
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

func runCommandWithTimeout(command string, timeout time.Duration) ([]byte, error, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "sh", "-c", command)
	output, err := cmd.CombinedOutput()
	if err == nil {
		return output, nil, false
	}

	if ctx.Err() == context.DeadlineExceeded {
		timeoutErr := fmt.Errorf("command timed out after %s", timeout)
		return output, combineCommandError(timeoutErr, output), true
	}

	return output, combineCommandError(err, output), false
}

func combineCommandError(err error, output []byte) error {
	msg := strings.TrimSpace(string(output))
	if msg == "" {
		return err
	}

	return fmt.Errorf("%w: %s", err, msg)
}

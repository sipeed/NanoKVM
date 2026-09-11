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

	daemonStatePollInterval = 100 * time.Millisecond
)

type Cli struct{}

type TsVersion struct {
	Current string
	Latest  string
}

type tailscaleVersionJSON struct {
	MajorMinorPatch string `json:"majorMinorPatch"`
	Upstream        string `json:"upstream"`
}

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
	return exec.Command("sh", "-c", command).Run()
}

func (c *Cli) Restart() error {
	commands := []string{
		fmt.Sprintf("cp -f %s %s", ScriptBackupPath, ScriptPath),
		fmt.Sprintf("%s restart", ScriptPath),
	}

	command := strings.Join(commands, " && ")
	return exec.Command("sh", "-c", command).Run()
}

// RestartAfterUpdate waits for the old daemon to exit before starting the new
// binary. S98tailscaled reports success as soon as start-stop-daemon sends the
// stop signal, so invoking its restart action directly can briefly run two
// tailscaled processes after an update.
func (c *Cli) RestartAfterUpdate(ctx context.Context) error {
	return restartAfterUpdate(ctx, c.Stop, c.Start, c.IsRunning)
}

func restartAfterUpdate(ctx context.Context, stop, start func() error, isRunning func() bool) error {
	if isRunning() {
		if err := stop(); err != nil && isRunning() {
			return fmt.Errorf("stop tailscale after update: %w", err)
		}
	}

	if err := waitForDaemonState(ctx, false, daemonStatePollInterval, isRunning); err != nil {
		return fmt.Errorf("wait for tailscaled to stop: %w", err)
	}

	if err := start(); err != nil {
		return fmt.Errorf("start tailscale after update: %w", err)
	}

	if err := waitForDaemonState(ctx, true, daemonStatePollInterval, isRunning); err != nil {
		return fmt.Errorf("wait for tailscaled to start: %w", err)
	}

	return nil
}

func (c *Cli) Stop() error {
	command := fmt.Sprintf("%s stop", ScriptPath)
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		return err
	}

	return os.Remove(ScriptPath)
}

func (c *Cli) Up() error {
	command := "tailscale up --accept-dns=false"
	return exec.Command("sh", "-c", command).Run()
}

func (c *Cli) Down() error {
	command := "tailscale down"
	return exec.Command("sh", "-c", command).Run()
}

func (c *Cli) Status() (*TsStatus, error) {
	command := "tailscale status --json"
	cmd := exec.Command("sh", "-c", command)

	output, err := cmd.CombinedOutput()
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
	return exec.Command("sh", "-c", command).Run()
}

func (c *Cli) Version(ctx context.Context, includeUpstream bool) (*TsVersion, error) {
	args := []string{"version", "--json"}
	if includeUpstream {
		args = append(args, "--upstream")
	}

	output, err := exec.CommandContext(ctx, TailscalePath, args...).CombinedOutput()
	if err != nil {
		return nil, commandError("get tailscale version", output, err)
	}

	return parseVersion(output, includeUpstream)
}

func (c *Cli) Update(ctx context.Context) error {
	output, err := exec.CommandContext(
		ctx,
		TailscalePath,
		"update",
		"--yes",
		"--track=stable",
	).CombinedOutput()
	if err != nil {
		return commandError("update tailscale", output, err)
	}

	return nil
}

func (c *Cli) IsRunning() bool {
	return exec.Command("pidof", "tailscaled").Run() == nil
}

func waitForDaemonState(ctx context.Context, wantRunning bool, pollInterval time.Duration, isRunning func() bool) error {
	if isRunning() == wantRunning {
		return nil
	}

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if isRunning() == wantRunning {
				return nil
			}
		}
	}
}

func parseVersion(output []byte, requireUpstream bool) (*TsVersion, error) {
	// Some Tailscale builds print a warning before their JSON output.
	if index := strings.IndexByte(string(output), '{'); index >= 0 {
		output = output[index:]
	}

	var version tailscaleVersionJSON
	if err := json.Unmarshal(output, &version); err != nil {
		return nil, fmt.Errorf("parse tailscale version: %w", err)
	}
	if version.MajorMinorPatch == "" {
		return nil, errors.New("parse tailscale version: current version is missing")
	}
	if requireUpstream && version.Upstream == "" {
		return nil, errors.New("parse tailscale version: upstream version is missing")
	}

	return &TsVersion{
		Current: version.MajorMinorPatch,
		Latest:  version.Upstream,
	}, nil
}

func commandError(action string, output []byte, err error) error {
	const maxOutputLength = 2048

	message := strings.TrimSpace(string(output))
	if len(message) > maxOutputLength {
		message = message[:maxOutputLength]
	}
	if message == "" {
		return fmt.Errorf("%s: %w", action, err)
	}

	return fmt.Errorf("%s: %w: %s", action, err, message)
}

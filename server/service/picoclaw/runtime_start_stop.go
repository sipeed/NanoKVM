package picoclaw

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func (s *Service) startRuntime() (string, string, *PicoclawError) {
	return s.startRuntimeContext(context.Background())
}

func (s *Service) startRuntimeContext(ctx context.Context) (string, string, *PicoclawError) {
	if ctx == nil {
		ctx = context.Background()
	}
	if s == nil {
		return "", "", newPicoclawError(CodeRuntimeStartFailed, "picoclaw service is unavailable")
	}
	if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
		return "", "", lifecycleErr
	}
	s.ensureDependencies()

	if installed, statErr := isPicoclawInstalled(); statErr != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = false
			status.ModelConfigured = false
			status.ModelName = ""
			status.Status = "not_installed"
			status.LastError = statErr.Error()
			status.CheckedAt = time.Now()
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, statErr.Error())
	} else if !installed {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = false
			status.ModelConfigured = false
			status.ModelName = ""
			status.Status = "not_installed"
			status.LastError = "picoclaw is not installed"
			status.CheckedAt = time.Now()
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, "picoclaw is not installed")
	}

	scriptPath, err := resolvePicoclawStartScript()
	if err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = true
			status.Status = "unavailable"
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, err.Error())
	}
	if err := ensurePicoclawStartupDefaults(); err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = true
			status.Status = "config_error"
			status.ConfigError = err.Error()
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, err.Error())
	}
	if err := s.detectGatewayPortConflict(); err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = true
			status.Status = "unavailable"
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, err.Error())
	}

	command := scriptPath + " start"
	startCtx, cancel := context.WithTimeout(ctx, picoclawStartTimeout)
	defer cancel()

	output, execErr := exec.CommandContext(startCtx, "sh", "-c", command).CombinedOutput()
	trimmedOutput := strings.TrimSpace(string(output))
	if execErr != nil {
		if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
			return command, trimmedOutput, lifecycleErr
		}
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Installed = true
			status.Status = "unavailable"
			status.LastError = trimmedOutput
			if status.LastError == "" {
				status.LastError = execErr.Error()
			}
			status.CheckedAt = time.Now()
		})
		return command, trimmedOutput, newPicoclawError(CodeRuntimeStartFailed, "failed to start picoclaw runtime")
	}

	if lifecycleErr := sleepRuntimeLifecycleContext(ctx, picoclawStartWaitPeriod); lifecycleErr != nil {
		return command, trimmedOutput, lifecycleErr
	}
	if runtimeErr := s.waitForRuntimeReadyContext(ctx, picoclawStartTimeout); runtimeErr != nil {
		startErr := newPicoclawError(CodeRuntimeStartFailed, runtimeErr.Message)
		failureStatus := "unavailable"
		if runtimeErr.Code == CodeControlModeConflict {
			startErr = runtimeErr
			failureStatus = "starting"
		} else {
			if cleanupErr := s.stopRuntimeAndVerify(true); cleanupErr != nil {
				failureStatus = "error"
				startErr.Message = fmt.Sprintf(
					"%s; failed to stop partially started runtime: %v",
					startErr.Message,
					cleanupErr,
				)
			}
		}
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = failureStatus
			status.LastError = startErr.Message
			status.CurrentSession = ""
			status.CheckedAt = time.Now()
		})
		return command, trimmedOutput, startErr
	}

	return command, trimmedOutput, nil
}

func (s *Service) markRuntimeLifecycleCanceled(err *PicoclawError) {
	if s == nil || err == nil || err.Code != CodeControlModeConflict {
		return
	}
	s.ensureDependencies()
	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		if isRuntimeLifecycleStatusPending(*status) {
			status.Status = "stopped"
		}
		status.LastError = err.Message
		status.CurrentSession = ""
		status.CheckedAt = time.Now()
	})
}

func (s *Service) stopRuntime() (string, string, *PicoclawError) {
	if s == nil {
		return "", "", newPicoclawError(CodeRuntimeStartFailed, "picoclaw service is unavailable")
	}
	s.ensureDependencies()

	settings, _ := loadPicoclawGatewaySettings()
	scriptPath, err := resolvePicoclawStartScript()
	if err != nil {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: settings.ModelConfigured,
			ModelName:       settings.ModelName,
			Status:          "unavailable",
			LastError:       err.Error(),
			CheckedAt:       time.Now(),
		})
		return "", "", newPicoclawError(CodeRuntimeStartFailed, err.Error())
	}

	command := scriptPath + " stop"
	ctx, cancel := context.WithTimeout(context.Background(), picoclawStopTimeout)
	defer cancel()

	output, execErr := exec.CommandContext(ctx, "sh", "-c", command).CombinedOutput()
	trimmedOutput := strings.TrimSpace(string(output))
	if execErr != nil {
		status := RuntimeStatus{
			Ready:           false,
			Installed:       true,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: settings.ModelConfigured,
			ModelName:       settings.ModelName,
			Status:          "error",
			LastError:       trimmedOutput,
			CheckedAt:       time.Now(),
		}
		if trimmedOutput == "" {
			status.LastError = execErr.Error()
		}
		s.runtime.Set(status)
		return command, trimmedOutput, newPicoclawError(CodeRuntimeStartFailed, "failed to stop picoclaw runtime")
	}

	time.Sleep(picoclawStopWaitPeriod)
	s.runtime.Set(RuntimeStatus{
		Ready:           false,
		Installed:       true,
		InstallPath:     picoclawBinaryPath,
		ModelConfigured: settings.ModelConfigured,
		ModelName:       settings.ModelName,
		Status:          "stopped",
		CheckedAt:       time.Now(),
		CurrentSession:  "",
	})

	return command, trimmedOutput, nil
}

func (s *Service) waitForRuntimeReady(timeout time.Duration) *PicoclawError {
	return s.waitForRuntimeReadyContext(context.Background(), timeout)
}

func (s *Service) waitForRuntimeReadyContext(ctx context.Context, timeout time.Duration) *PicoclawError {
	if ctx == nil {
		ctx = context.Background()
	}
	deadline := time.Now().Add(timeout)
	var lastErr *PicoclawError

	for {
		if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
			return lifecycleErr
		}

		runtimeErr := s.ensureRuntimeReadyForLifecycleContext(ctx)
		if runtimeErr == nil {
			return nil
		} else {
			lastErr = runtimeErr
		}

		if time.Now().After(deadline) {
			break
		}

		if lifecycleErr := sleepRuntimeLifecycleContext(ctx, picoclawReadyPollPeriod); lifecycleErr != nil {
			return lifecycleErr
		}
	}

	if lastErr != nil {
		return lastErr
	}
	return newPicoclawError(CodeRuntimeUnavailable, "gateway is unavailable")
}

func resolvePicoclawStartScript() (string, error) {
	if _, err := os.Stat(kvmappPicoclawScript); err == nil {
		return kvmappPicoclawScript, nil
	}
	if _, err := os.Stat(etcInitPicoclawScript); err == nil {
		return etcInitPicoclawScript, nil
	}
	return "", fmt.Errorf("picoclaw start script not found: %s or %s", etcInitPicoclawScript, kvmappPicoclawScript)
}

func runPicoclawOnboard() (string, *PicoclawError) {
	return runPicoclawOnboardContext(context.Background())
}

func runPicoclawOnboardContext(ctx context.Context) (string, *PicoclawError) {
	if ctx == nil {
		ctx = context.Background()
	}
	scriptPath, err := resolvePicoclawStartScript()
	if err != nil {
		return "", newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}
	if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
		return "", lifecycleErr
	}

	command := scriptPath + " onboard"
	onboardCtx, cancel := context.WithTimeout(ctx, picoclawOnboardTimeout)
	defer cancel()

	output, execErr := exec.CommandContext(onboardCtx, "sh", "-c", command).CombinedOutput()
	trimmedOutput := strings.TrimSpace(string(output))
	if execErr != nil {
		if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
			return trimmedOutput, lifecycleErr
		}
		if trimmedOutput == "" {
			trimmedOutput = execErr.Error()
		}
		return trimmedOutput, newPicoclawError(CodeRuntimeUnavailable, "failed to initialize picoclaw config")
	}

	return trimmedOutput, nil
}

func sleepRuntimeLifecycleContext(ctx context.Context, delay time.Duration) *PicoclawError {
	if ctx == nil {
		ctx = context.Background()
	}
	if delay <= 0 {
		return runtimeLifecycleOperationError(ctx)
	}
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return runtimeLifecycleOperationError(ctx)
	case <-timer.C:
		return nil
	}
}

func isPicoclawInstalled() (bool, error) {
	info, err := os.Stat(picoclawBinaryPath)
	if err == nil {
		return !info.IsDir(), nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func isRuntimeRunning() (bool, error) {
	pid, err := runtimeGatewayPID()
	if err != nil {
		return false, err
	}
	return pid > 0, nil
}

func (s *Service) detectGatewayPortConflict() error {
	running, err := isRuntimeRunning()
	if err != nil {
		return fmt.Errorf("check PicoClaw gateway process: %w", err)
	}
	if running {
		return nil
	}

	settings, err := loadPicoclawGatewaySettings()
	if err != nil {
		return nil
	}
	parsed, err := url.Parse(settings.GatewayURL)
	if err != nil {
		return nil
	}
	hostPort, err := gatewayHostPort(parsed)
	if err != nil {
		return nil
	}

	timeout := 2 * time.Second
	if s != nil && s.config != nil {
		if configured := time.Duration(s.config.Get().ConnectTimeoutMs) * time.Millisecond; configured > 0 {
			timeout = configured
		}
	}
	conn, err := net.DialTimeout("tcp", hostPort, timeout)
	if err != nil {
		return nil
	}
	_ = conn.Close()

	return fmt.Errorf("gateway port %s is already in use by another process", hostPort)
}

func resolvePicoclawPIDPath() (string, error) {
	home, err := resolvePicoclawHome()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, picoclawPIDFileName), nil
}

func runtimeGatewayPID() (int, error) {
	pidPath, err := resolvePicoclawPIDPath()
	if err != nil {
		return 0, err
	}

	pid, err := readRuntimePIDFile(pidPath)
	if err == nil {
		running, processErr := isPicoclawGatewayProcess(pid)
		if processErr != nil {
			return 0, processErr
		}
		if running {
			return pid, nil
		}
		_ = os.Remove(pidPath)
	} else if !os.IsNotExist(err) {
		_ = os.Remove(pidPath)
	}

	pid, err = findPicoclawGatewayProcess()
	if err != nil {
		return 0, err
	}
	if pid > 0 {
		_ = os.MkdirAll(filepath.Dir(pidPath), 0o755)
		_ = os.WriteFile(pidPath, []byte(strconv.Itoa(pid)+"\n"), 0o600)
	}
	return pid, nil
}

func readRuntimePIDFile(path string) (int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	pid, parseErr := strconv.Atoi(strings.TrimSpace(string(data)))
	if parseErr != nil || pid <= 0 {
		return 0, fmt.Errorf("invalid PicoClaw pid file: %s", path)
	}
	return pid, nil
}

func isPicoclawGatewayProcess(pid int) (bool, error) {
	if pid <= 0 {
		return false, nil
	}
	cmdlinePath := filepath.Join("/proc", strconv.Itoa(pid), "cmdline")
	data, err := os.ReadFile(cmdlinePath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return isPicoclawGatewayCmdline(data), nil
}

func isPicoclawGatewayCmdline(data []byte) bool {
	parts := strings.Split(string(data), "\x00")
	args := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			args = append(args, part)
		}
	}
	if len(args) < 2 {
		return false
	}

	binName := filepath.Base(picoclawBinaryPath)
	if binName == "" || binName == "." || binName == string(filepath.Separator) {
		return false
	}

	return filepath.Base(args[0]) == binName && args[1] == "gateway"
}

func findPicoclawGatewayProcess() (int, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(entry.Name())
		if err != nil || pid <= 0 {
			continue
		}
		running, err := isPicoclawGatewayProcess(pid)
		if err != nil {
			continue
		}
		if running {
			return pid, nil
		}
	}

	return 0, nil
}

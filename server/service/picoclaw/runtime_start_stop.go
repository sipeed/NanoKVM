package picoclaw

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func (s *Service) startRuntime() (string, string, *PicoclawError) {
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
	if err := ensurePicoclawNanoKVMDefaults(); err != nil {
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

	command := scriptPath + " start"
	ctx, cancel := context.WithTimeout(context.Background(), picoclawStartTimeout)
	defer cancel()

	output, execErr := exec.CommandContext(ctx, "sh", "-c", command).CombinedOutput()
	trimmedOutput := strings.TrimSpace(string(output))
	if execErr != nil {
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

	time.Sleep(picoclawStartWaitPeriod)
	if runtimeErr := s.waitForRuntimeReady(picoclawStartTimeout); runtimeErr != nil {
		startErr := newPicoclawError(CodeRuntimeStartFailed, runtimeErr.Message)
		return command, trimmedOutput, startErr
	}

	return command, trimmedOutput, nil
}

func (s *Service) stopRuntime() (string, string, *PicoclawError) {
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
	deadline := time.Now().Add(timeout)
	var lastErr *PicoclawError

	for {
		if runtimeErr := s.ensureRuntimeReady(); runtimeErr == nil {
			return nil
		} else {
			lastErr = runtimeErr
		}

		if time.Now().After(deadline) {
			break
		}

		time.Sleep(picoclawReadyPollPeriod)
	}

	if lastErr != nil {
		return lastErr
	}
	return newPicoclawError(CodeRuntimeUnavailable, "gateway is unavailable")
}

func resolvePicoclawStartScript() (string, error) {
	if _, err := os.Stat(etcInitPicoclawScript); err == nil {
		return etcInitPicoclawScript, nil
	}
	if _, err := os.Stat(kvmappPicoclawScript); err == nil {
		return kvmappPicoclawScript, nil
	}
	return "", fmt.Errorf("picoclaw start script not found: %s or %s", etcInitPicoclawScript, kvmappPicoclawScript)
}

func runPicoclawOnboard() (string, *PicoclawError) {
	scriptPath, err := resolvePicoclawStartScript()
	if err != nil {
		return "", newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}

	command := scriptPath + " onboard"
	ctx, cancel := context.WithTimeout(context.Background(), picoclawOnboardTimeout)
	defer cancel()

	output, execErr := exec.CommandContext(ctx, "sh", "-c", command).CombinedOutput()
	trimmedOutput := strings.TrimSpace(string(output))
	if execErr != nil {
		if trimmedOutput == "" {
			trimmedOutput = execErr.Error()
		}
		return trimmedOutput, newPicoclawError(CodeRuntimeUnavailable, "failed to initialize picoclaw config")
	}
	if err := ensurePicoclawNanoKVMDefaults(); err != nil {
		return trimmedOutput, newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}

	return trimmedOutput, nil
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
	binName := filepath.Base(picoclawBinaryPath)
	if binName == "" || binName == "." || binName == string(filepath.Separator) {
		return false, fmt.Errorf("invalid picoclaw binary path: %s", picoclawBinaryPath)
	}

	command := exec.Command("pidof", binName)
	if err := command.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

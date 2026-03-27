package picoclaw

import (
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Service) StartRuntime(c *gin.Context) {
	command, output, err := s.startRuntime()
	if err != nil {
		writePicoclawError(c, err)
		return
	}

	writeSuccess(c, RuntimeStartResult{
		Started: true,
		Command: command,
		Output:  output,
		Status:  s.runtime.Get(),
	})
}

func (s *Service) StopRuntime(c *gin.Context) {
	command, output, err := s.stopRuntime()
	if err != nil {
		writePicoclawError(c, err)
		return
	}

	writeSuccess(c, RuntimeStartResult{
		Started: false,
		Command: command,
		Output:  output,
		Status:  s.runtime.Get(),
	})
}

func (s *Service) InstallRuntime(c *gin.Context) {
	output, err := s.installRuntime()
	if err != nil {
		writePicoclawError(c, err)
		return
	}

	currentStatus := s.runtime.Get()
	writeSuccess(c, RuntimeInstallResult{
		Installed: currentStatus.Installed && !currentStatus.Installing,
		Binary:    picoclawBinaryPath,
		Download:  picoclawDownloadURL,
		Output:    output,
		Status:    currentStatus,
	})
}

func (s *Service) UninstallRuntime(c *gin.Context) {
	currentStatus := s.runtime.Get()
	uninstallOutput := "picoclaw uninstalled successfully"
	if currentStatus.Installing {
		writePicoclawError(c, newPicoclawError(CodeRuntimeStartFailed, "cannot uninstall while installation is in progress"))
		return
	}

	running, err := isRuntimeRunning()
	if err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to check picoclaw runtime status"))
		return
	}

	if running || currentStatus.Ready || currentStatus.Status == "ready" {
		if _, _, stopErr := s.stopRuntime(); stopErr != nil {
			uninstallOutput = "picoclaw uninstalled successfully (stop failed before uninstall: " + stopErr.Message + ")"
		}
	}

	if configPath, err := resolvePicoclawConfigPath(); err == nil {
		_ = os.RemoveAll(filepath.Dir(configPath))
	} else {
		home, err := os.UserHomeDir()
		if err == nil {
			_ = os.RemoveAll(filepath.Join(home, ".picoclaw"))
		} else {
			_ = os.RemoveAll("/root/.picoclaw")
		}
	}
	_ = os.Remove(picoclawBinaryPath)
	_ = os.RemoveAll(picoclawCacheDir)

	s.runtime.Set(RuntimeStatus{
		Ready:           false,
		Installed:       false,
		Installing:      false,
		InstallProgress: 0,
		InstallStage:    "",
		InstallPath:     picoclawBinaryPath,
		Status:          "not_installed",
		CheckedAt:       time.Now(),
		CurrentSession:  "",
	})

	writeSuccess(c, RuntimeInstallResult{
		Installed: false,
		Binary:    picoclawBinaryPath,
		Download:  picoclawDownloadURL,
		Output:    uninstallOutput,
		Status:    s.runtime.Get(),
	})
}

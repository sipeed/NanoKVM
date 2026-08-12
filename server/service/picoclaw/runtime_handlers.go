package picoclaw

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"time"

	"NanoKVM-Server/service/controlmode"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) StartRuntime(c *gin.Context) {
	defer s.recoverRuntimeHandler(c, "start")
	s.ensureDependencies()
	log.Info("picoclaw runtime start requested")

	// Lock order: hold a stable PicoClaw control lease before entering the
	// runtime lifecycle section, so MCP/off transitions wait instead of racing
	// the start script and desired-running commit.
	releaseControl, controlErr := s.acquireControlMode()
	if controlErr != nil {
		status := s.runtimeStatus()
		log.WithFields(log.Fields{
			"code":          controlErr.Code,
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Warn("picoclaw runtime start rejected by control mode")
		writePicoclawErrorWithData(c, controlErr, gin.H{"status": status})
		return
	}
	defer releaseControl()

	operationCtx, releaseOperation := s.beginRuntimeLifecycleOperation(c.Request.Context())
	defer releaseOperation()

	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()

	if lifecycleErr := runtimeLifecycleOperationError(operationCtx); lifecycleErr != nil {
		writePicoclawErrorWithData(c, lifecycleErr, gin.H{"status": s.runtimeStatus()})
		return
	}

	if currentStatus := s.runtime.Get(); currentStatus.Installing {
		runtimeErr := newPicoclawError(CodeRuntimeUnavailable, "picoclaw installation is in progress")
		writePicoclawErrorWithData(c, runtimeErr, gin.H{"status": s.runtimeStatus()})
		return
	}

	if readyErr := s.ensureRuntimeReadyForLifecycleContext(operationCtx); readyErr == nil {
		s.setRuntimeIntentDesired(true, "web")
		status := s.runtimeStatus()
		log.WithFields(log.Fields{
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Info("picoclaw runtime start skipped because runtime is already ready")
		writeSuccess(c, RuntimeStartResult{
			Started: true,
			Status:  status,
		})
		return
	}

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		status.Status = "starting"
		status.LastError = ""
		status.CheckedAt = time.Now()
	})

	command, output, startErr := s.startRuntimeContext(operationCtx)
	if startErr != nil {
		s.markRuntimeLifecycleCanceled(startErr)
		s.setRuntimeIntentError(startErr.Message)
		status := s.runtimeStatus()
		log.WithFields(log.Fields{
			"code":          startErr.Code,
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Warn("picoclaw runtime start returning structured error")
		writePicoclawErrorWithData(c, startErr, gin.H{
			"command": command,
			"output":  output,
			"status":  status,
		})
		return
	}

	if err := s.control.RequireWrite(controlmode.ModePicoclaw); err != nil {
		controlErr := s.controlWriteError(controlmode.ModePicoclaw, err)
		s.setRuntimeIntentError(controlErr.Message)
		status := s.runtimeStatus()
		log.WithFields(log.Fields{
			"code":          controlErr.Code,
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Warn("picoclaw runtime start lost control before intent commit")
		writePicoclawErrorWithData(c, controlErr, gin.H{
			"command": command,
			"output":  output,
			"status":  status,
		})
		return
	}

	s.setRuntimeIntentDesired(true, "web")
	status := s.runtimeStatus()
	log.WithFields(log.Fields{
		"runtimeStatus": status.Status,
		"ready":         status.Ready,
		"controlMode":   status.ControlMode,
	}).Info("picoclaw runtime start returning success")
	writeSuccess(c, RuntimeStartResult{
		Started: true,
		Command: command,
		Output:  output,
		Status:  status,
	})
}

func (s *Service) StopRuntime(c *gin.Context) {
	defer s.recoverRuntimeHandler(c, "stop")
	s.ensureDependencies()
	log.Info("picoclaw runtime stop requested")

	switched, err := s.control.SwitchIfWithCleanup(
		controlmode.ModePicoclaw,
		controlmode.ModeOff,
		func() error {
			s.CancelActiveControlOperations()
			return nil
		},
		s.releaseHID,
	)
	if err != nil {
		status := s.runtimeStatus()
		picoclawErr := newPicoclawError(CodeRuntimeStartFailed, err.Error())
		log.WithFields(log.Fields{
			"code":          picoclawErr.Code,
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Warn("picoclaw runtime stop returning structured error")
		writePicoclawErrorWithData(c, picoclawErr, gin.H{"status": status})
		return
	}
	if switched {
		if status, statusErr := s.control.Status(); statusErr == nil {
			s.PublishControlModeChangedFrom(status, "runtime_stop")
		}
	}

	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()
	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		status.Status = "stopping"
		status.LastError = ""
		status.CheckedAt = time.Now()
	})
	s.setRuntimeIntentDesired(false, "web")

	err = s.stopForRuntimeStop()
	if err != nil {
		s.setRuntimeIntentError(err.Error())
		status := s.runtimeStatus()
		picoclawErr := newPicoclawError(CodeRuntimeStartFailed, err.Error())
		log.WithFields(log.Fields{
			"code":          picoclawErr.Code,
			"runtimeStatus": status.Status,
			"ready":         status.Ready,
			"controlMode":   status.ControlMode,
		}).Warn("picoclaw runtime stop returning structured error")
		writePicoclawErrorWithData(c, picoclawErr, gin.H{"status": status})
		return
	}

	status := s.runtimeStatus()
	log.WithFields(log.Fields{
		"runtimeStatus": status.Status,
		"ready":         status.Ready,
		"controlMode":   status.ControlMode,
	}).Info("picoclaw runtime stop returning success")
	writeSuccess(c, RuntimeStartResult{
		Started: false,
		Status:  status,
	})
}

func (s *Service) recoverRuntimeHandler(c *gin.Context, operation string) {
	if recovered := recover(); recovered != nil {
		message := fmt.Sprintf("picoclaw runtime %s panicked: %v", operation, recovered)
		log.Errorf("%s\n%s", message, debug.Stack())
		if c.Writer.Written() {
			return
		}
		writePicoclawErrorWithData(
			c,
			newPicoclawError(CodeRuntimeStartFailed, message),
			gin.H{"status": s.safeRuntimeStatusForRecovery()},
		)
	}
}

func (s *Service) safeRuntimeStatusForRecovery() (status RuntimeStatus) {
	defer func() {
		if recover() != nil {
			status = RuntimeStatus{
				Ready:       false,
				Installed:   false,
				InstallPath: picoclawBinaryPath,
				Status:      "error",
			}
		}
	}()
	if s == nil {
		return RuntimeStatus{
			Ready:       false,
			Installed:   false,
			InstallPath: picoclawBinaryPath,
			Status:      "error",
		}
	}
	return s.runtimeStatus()
}

func (s *Service) InstallRuntime(c *gin.Context) {
	s.ensureDependencies()
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
		Status:    s.runtimeStatus(),
	})
}

func (s *Service) UninstallRuntime(c *gin.Context) {
	s.ensureDependencies()
	currentStatus := s.runtime.Get()
	uninstallOutput := "picoclaw uninstalled successfully"
	if currentStatus.Installing {
		writePicoclawError(c, newPicoclawError(CodeRuntimeStartFailed, "cannot uninstall while installation is in progress"))
		return
	}

	switched, switchErr := s.control.SwitchIfWithCleanup(
		controlmode.ModePicoclaw,
		controlmode.ModeOff,
		func() error {
			s.CancelActiveControlOperations()
			return nil
		},
		s.releaseHID,
	)
	if switchErr != nil {
		status := s.runtimeStatus()
		writePicoclawErrorWithData(c, newPicoclawError(CodeRuntimeStartFailed, "control release failed before uninstall: "+switchErr.Error()), gin.H{"status": status})
		return
	}
	if switched {
		if status, statusErr := s.control.Status(); statusErr == nil {
			s.PublishControlModeChangedFrom(status, "runtime_uninstall")
		}
	}

	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()

	currentStatus = s.runtime.Get()
	if currentStatus.Installing {
		writePicoclawError(c, newPicoclawError(CodeRuntimeStartFailed, "cannot uninstall while installation is in progress"))
		return
	}
	running, err := isRuntimeRunning()
	if err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to check picoclaw runtime status"))
		return
	}

	if running || currentStatus.Ready || currentStatus.Status == "ready" || isRuntimeLifecycleStatusPending(currentStatus) {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Restoring = false
			status.Status = "stopping"
			status.LastError = ""
			status.CheckedAt = time.Now()
		})
		if stopErr := s.stopRuntimeAndCloseSessions(CloseCodeRuntimeStopped, "PicoClaw runtime stopped"); stopErr != nil {
			uninstallOutput = "picoclaw uninstalled successfully (stop failed before uninstall: " + stopErr.Error() + ")"
		}
	}
	s.setRuntimeIntentDesired(false, "web")

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
		Status:    s.runtimeStatus(),
	})
}

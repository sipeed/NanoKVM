package picoclaw

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"NanoKVM-Server/service/controlmode"

	log "github.com/sirupsen/logrus"
)

const RuntimeIntentFile = "/etc/kvm/picoclaw-runtime.json"

func NewRuntimeIntentStore(path string) *RuntimeIntentStore {
	if path == "" {
		path = RuntimeIntentFile
	}
	return &RuntimeIntentStore{path: path}
}

func (s *RuntimeIntentStore) Load() (RuntimeIntentStatus, error) {
	if s == nil {
		return RuntimeIntentStatus{}, nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.loadLocked()
}

func (s *RuntimeIntentStore) SetDesiredRunning(desired bool, updatedBy string) error {
	if s == nil {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	intent, err := s.loadLocked()
	if err != nil {
		intent = RuntimeIntentStatus{
			DesiredRunning: false,
			LastError:      err.Error(),
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)
	intent.DesiredRunning = desired
	intent.UpdatedAt = now
	intent.UpdatedBy = updatedBy
	intent.LastError = ""
	if desired {
		intent.LastStartedAt = now
	} else {
		intent.LastStoppedAt = now
	}

	return s.saveLocked(intent)
}

func (s *RuntimeIntentStore) SetLastError(message string) error {
	if s == nil {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	intent, err := s.loadLocked()
	if err != nil {
		intent = RuntimeIntentStatus{
			DesiredRunning: false,
		}
	}

	intent.LastError = message
	intent.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if intent.UpdatedBy == "" {
		intent.UpdatedBy = "system"
	}

	return s.saveLocked(intent)
}

func (s *RuntimeIntentStore) loadLocked() (RuntimeIntentStatus, error) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return RuntimeIntentStatus{DesiredRunning: false}, nil
		}
		return RuntimeIntentStatus{DesiredRunning: false}, fmt.Errorf("read PicoClaw runtime intent: %w", err)
	}

	var intent RuntimeIntentStatus
	if err := json.Unmarshal(data, &intent); err != nil {
		return RuntimeIntentStatus{
			DesiredRunning: false,
			LastError:      err.Error(),
		}, fmt.Errorf("parse PicoClaw runtime intent: %w", err)
	}

	return intent, nil
}

func (s *RuntimeIntentStore) saveLocked(intent RuntimeIntentStatus) error {
	dir := filepath.Dir(s.path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create PicoClaw runtime intent directory: %w", err)
	}

	data, err := json.MarshalIndent(intent, "", "  ")
	if err != nil {
		return fmt.Errorf("encode PicoClaw runtime intent: %w", err)
	}
	data = append(data, '\n')

	tmp, err := os.CreateTemp(dir, ".picoclaw-runtime.*")
	if err != nil {
		return fmt.Errorf("create temporary PicoClaw runtime intent: %w", err)
	}
	tmpPath := tmp.Name()
	defer func() { _ = os.Remove(tmpPath) }()

	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("set PicoClaw runtime intent permissions: %w", err)
	}
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write PicoClaw runtime intent: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("sync PicoClaw runtime intent: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close PicoClaw runtime intent: %w", err)
	}
	if err := os.Rename(tmpPath, s.path); err != nil {
		return fmt.Errorf("replace PicoClaw runtime intent: %w", err)
	}

	directory, err := os.Open(dir)
	if err == nil {
		if syncErr := directory.Sync(); syncErr != nil {
			_ = directory.Close()
			return fmt.Errorf("sync PicoClaw runtime intent directory: %w", syncErr)
		}
		_ = directory.Close()
	}

	return nil
}

func (s *Service) setRuntimeIntentDesired(desired bool, updatedBy string) {
	if s == nil {
		return
	}
	s.ensureDependencies()
	if err := s.runtimeIntent.SetDesiredRunning(desired, updatedBy); err != nil {
		log.WithFields(log.Fields{
			"desired_running": desired,
			"updated_by":      updatedBy,
		}).WithError(err).Warn("failed to persist PicoClaw runtime intent")
	}
}

func (s *Service) SetRuntimeIntentDesired(desired bool, updatedBy string) {
	s.setRuntimeIntentDesired(desired, updatedBy)
}

func (s *Service) setRuntimeIntentError(message string) {
	if s == nil || message == "" {
		return
	}
	s.ensureDependencies()
	if err := s.runtimeIntent.SetLastError(message); err != nil {
		log.WithError(err).Warn("failed to persist PicoClaw runtime intent error")
	}
}

func (s *Service) startRuntimeIntentReconcile() {
	if s == nil {
		return
	}
	s.ensureDependencies()
	s.reconcileOnce.Do(func() {
		go s.reconcileRuntimeIntent("startup")
	})
}

func (s *Service) reconcileRuntimeIntent(source string) {
	startedAt := time.Now()
	s.ensureDependencies()

	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()

	intent, intentErr := s.runtimeIntent.Load()
	if intentErr != nil {
		s.setRuntimeIntentError(intentErr.Error())
		log.WithError(intentErr).Warn("PicoClaw runtime restore skipped because intent is invalid")
		return
	}

	modeStatus, modeErr := s.control.Status()
	if modeErr != nil {
		s.setRuntimeIntentError(modeErr.Error())
		log.WithError(modeErr).Warn("PicoClaw runtime restore skipped because control mode is unavailable")
		return
	}

	fields := log.Fields{
		"source":          source,
		"desired_running": intent.DesiredRunning,
		"control_mode":    string(modeStatus.Mode),
	}

	if !intent.DesiredRunning {
		s.reconcileDisabledRuntimeIntent(source)
		log.WithFields(fields).Info("PicoClaw runtime restore skipped because desired_running is false")
		return
	}
	if modeStatus.Mode == controlmode.ModeMCP {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "blocked_by_mcp"
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).Info("PicoClaw runtime restore skipped because MCP owns device control")
		return
	}
	if modeStatus.Mode != controlmode.ModePicoclaw {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "stopped"
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).Info("PicoClaw runtime restore skipped because PicoClaw does not own device control")
		return
	}

	releaseControl, controlErr := s.acquireControlMode()
	if controlErr != nil {
		s.setRuntimeIntentError(controlErr.Message)
		log.WithFields(fields).Warn("PicoClaw runtime restore skipped because PicoClaw control is not stable")
		return
	}
	defer releaseControl()

	intent, intentErr = s.runtimeIntent.Load()
	if intentErr != nil {
		s.setRuntimeIntentError(intentErr.Error())
		log.WithError(intentErr).Warn("PicoClaw runtime restore skipped because intent changed to an invalid state")
		return
	}
	if !intent.DesiredRunning {
		fields["desired_running"] = intent.DesiredRunning
		log.WithFields(fields).Info("PicoClaw runtime restore skipped because desired_running changed while waiting")
		return
	}

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = true
		status.Status = "restoring"
		status.LastError = ""
		status.CheckedAt = time.Now()
	})

	if readyErr := s.ensureRuntimeReadyForLifecycle(); readyErr == nil {
		fields["elapsed_ms"] = time.Since(startedAt).Milliseconds()
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Restoring = false
			status.Status = "ready"
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).Info("PicoClaw runtime restore found an already-ready runtime")
		return
	}

	currentStatus := s.runtime.Get()
	switch currentStatus.Status {
	case "not_installed", "model_not_configured", "config_error":
		message := currentStatus.LastError
		if message == "" {
			message = currentStatus.ConfigError
		}
		if message == "" {
			message = "PicoClaw runtime restore prerequisites are not satisfied"
		}
		s.setRuntimeIntentError(message)
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Restoring = false
			status.LastError = message
			status.CheckedAt = time.Now()
		})
		fields["elapsed_ms"] = time.Since(startedAt).Milliseconds()
		fields["runtime_status"] = currentStatus.Status
		log.WithFields(fields).Warn("PicoClaw runtime restore skipped because prerequisites are not satisfied")
		return
	}

	command, output, startErr := s.startRuntime()
	fields["elapsed_ms"] = time.Since(startedAt).Milliseconds()
	fields["command"] = command
	if output != "" {
		fields["output"] = output
	}
	if startErr != nil {
		s.setRuntimeIntentError(startErr.Message)
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Restoring = false
			if status.Status == "restoring" {
				status.Status = "unavailable"
			}
			status.LastError = startErr.Message
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).WithError(errors.New(startErr.Message)).Warn("PicoClaw runtime restore failed")
		return
	}

	intent, intentErr = s.runtimeIntent.Load()
	if intentErr != nil {
		s.setRuntimeIntentError(intentErr.Error())
		log.WithError(intentErr).Warn("PicoClaw runtime restore result discarded because intent became invalid")
		return
	}
	if !intent.DesiredRunning {
		log.WithFields(fields).Info("PicoClaw runtime restore result discarded because desired_running is now false")
		return
	}
	if err := s.control.RequireWrite(controlmode.ModePicoclaw); err != nil {
		controlErr := s.controlWriteError(controlmode.ModePicoclaw, err)
		s.setRuntimeIntentError(controlErr.Message)
		log.WithFields(fields).Warn("PicoClaw runtime restore result discarded because control changed")
		return
	}

	s.setRuntimeIntentDesired(true, "restore")
	s.runtime.Update(func(status *RuntimeStatus) {
		status.Restoring = false
		status.CheckedAt = time.Now()
	})
	log.WithFields(fields).Info("PicoClaw runtime restored from persisted intent")
}

func (s *Service) reconcileDisabledRuntimeIntent(source string) {
	status := s.runtime.Get()
	running, err := isRuntimeRunning()
	fields := log.Fields{
		"source":         source,
		"runtime_status": status.Status,
		"ready":          status.Ready,
	}
	if err != nil {
		s.setRuntimeIntentError(err.Error())
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Restoring = false
			status.Status = "unavailable"
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).WithError(err).Warn("PicoClaw disabled runtime intent could not check runtime")
		return
	}

	if !running && !status.Ready && !isRuntimeLifecycleStatusPending(status) {
		s.applyDisabledRuntimeIntentStatus()
		log.WithFields(fields).Info("PicoClaw disabled runtime intent kept runtime stopped")
		return
	}

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		status.Status = "stopping"
		status.LastError = ""
		status.CheckedAt = time.Now()
	})
	if err := s.stopRuntimeAndCloseSessions(CloseCodeRuntimeStopped, "PicoClaw runtime disabled"); err != nil {
		s.setRuntimeIntentError(err.Error())
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Restoring = false
			status.Status = "unavailable"
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
		})
		log.WithFields(fields).WithError(err).Warn("PicoClaw disabled runtime intent failed to stop runtime")
		return
	}

	s.applyDisabledRuntimeIntentStatus()
	log.WithFields(fields).Info("PicoClaw disabled runtime intent stopped runtime")
}

func (s *Service) applyDisabledRuntimeIntentStatus() {
	installed, installedKnown := picoclawInstalledState()
	settings, settingsErr := loadPicoclawGatewaySettings()

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		status.CurrentSession = ""
		status.CheckedAt = time.Now()
		if installedKnown {
			status.Installed = installed
		}
		if installedKnown && !installed {
			status.ModelConfigured = false
			status.ModelName = ""
			status.Status = "not_installed"
			status.LastError = ""
			return
		}
		if settingsErr == nil {
			status.ModelConfigured = settings.ModelConfigured
			status.ModelName = settings.ModelName
			if !settings.ModelConfigured {
				status.ModelName = settings.TargetModelName
				status.Status = "model_not_configured"
				return
			}
		}
		status.Status = "stopped"
		if status.LastError == "picoclaw runtime is stopped" {
			status.LastError = ""
		}
	})
}

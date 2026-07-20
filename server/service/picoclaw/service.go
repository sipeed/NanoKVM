package picoclaw

import (
	"context"
	"os"
	"sync"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"

	"github.com/gin-gonic/gin"
)

const sessionIDHeader = "X-PicoClaw-Session-ID"

var (
	configStoreOnce        sync.Once
	configStore            *ConfigStore
	runtimeStoreOnce       sync.Once
	runtimeStore           *RuntimeStore
	runtimeIntentStoreOnce sync.Once
	runtimeIntentStore     *RuntimeIntentStore
	probeLoopOnce          sync.Once
)

const runtimeStatusRefreshInterval = 2 * time.Second

func NewService(control *controlmode.Manager) *Service {
	if control == nil {
		control = controlmode.GetManager()
	}
	service := &Service{
		vision:        common.GetKvmVision(),
		hid:           hid.GetHid(),
		config:        getConfigStore(),
		lock:          GetSessionLock(),
		runtime:       getRuntimeStore(),
		runtimeIntent: getRuntimeIntentStore(),
		control:       control,
		releaseHID:    hid.ReleaseAllHIDStateBestEffort,
		operations:    newControlOperationTracker(),
	}
	service.ensureDependencies()
	service.startRuntimeIntentReconcile()
	return service
}

func (s *Service) ensureDependencies() {
	if s == nil {
		return
	}
	if s.vision == nil {
		s.vision = common.GetKvmVision()
	}
	if s.hid == nil {
		s.hid = hid.GetHid()
	}
	if s.config == nil {
		s.config = getConfigStore()
	}
	if s.lock == nil {
		s.lock = GetSessionLock()
	}
	if s.runtime == nil {
		s.runtime = getRuntimeStore()
	}
	if s.runtimeIntent == nil {
		s.runtimeIntent = getRuntimeIntentStore()
	}
	if s.control == nil {
		s.control = controlmode.GetManager()
	}
	if s.releaseHID == nil {
		s.releaseHID = hid.ReleaseAllHIDStateBestEffort
	}
	if s.operations == nil {
		s.operations = newControlOperationTracker()
	}
}

func getConfigStore() *ConfigStore {
	configStoreOnce.Do(func() {
		configStore = &ConfigStore{
			config: defaultConfig(),
		}
	})

	return configStore
}

func getRuntimeStore() *RuntimeStore {
	runtimeStoreOnce.Do(func() {
		runtimeStore = &RuntimeStore{
			status: RuntimeStatus{
				Ready:           false,
				Installed:       false,
				Installing:      false,
				InstallProgress: 0,
				InstallPath:     picoclawBinaryPath,
				ModelConfigured: false,
				Status:          "checking",
			},
		}
	})

	return runtimeStore
}

func getRuntimeIntentStore() *RuntimeIntentStore {
	runtimeIntentStoreOnce.Do(func() {
		runtimeIntentStore = NewRuntimeIntentStore(RuntimeIntentFile)
	})

	return runtimeIntentStore
}

func (s *Service) GetRuntimeStatus(c *gin.Context) {
	s.ensureDependencies()
	s.startRuntimeProbeLoop()
	modeStatus, modeErr := s.control.Status()
	if modeErr != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, modeErr.Error()))
		return
	}
	status := s.runtime.Get()
	if shouldRefreshRuntimeStatus(status) {
		_ = s.ensureRuntimeReady()
		status = s.runtime.Get()
	}

	if installed, ok := picoclawInstalledState(); ok {
		status.Installed = installed
		s.runtime.Update(func(current *RuntimeStatus) {
			current.Installed = installed
		})
	}

	status = s.applyRuntimeIntentStatus(applyControlModeStatus(status, modeStatus))
	writeSuccess(c, withAgentProfile(status))
}

func (s *Service) GetRuntimeSession(c *gin.Context) {
	s.ensureDependencies()
	writeSuccess(c, gin.H{
		"current_session": s.lock.Owner(),
		"checked_at":      time.Now(),
	})
}

func (s *Service) runtimeStatus() RuntimeStatus {
	s.ensureDependencies()
	status := s.runtime.Get()
	modeStatus, err := s.control.Status()
	if err != nil {
		status.ControlMode = string(controlmode.ModeOff)
		return status
	}
	return s.applyRuntimeIntentStatus(applyControlModeStatus(status, modeStatus))
}

func (s *Service) applyRuntimeIntentStatus(status RuntimeStatus) RuntimeStatus {
	if s == nil {
		return status
	}
	s.ensureDependencies()
	intent, err := s.runtimeIntent.Load()
	status.RuntimeIntent = intent
	if err != nil && status.RuntimeIntent.LastError == "" {
		status.RuntimeIntent.LastError = err.Error()
	}
	status.Restoring = status.Restoring || status.Status == "restoring"
	return status
}

func applyControlModeStatus(status RuntimeStatus, modeStatus controlmode.Status) RuntimeStatus {
	status.ControlMode = string(modeStatus.Mode)
	status.Transitioning = modeStatus.Transitioning
	canControl := modeStatus.Mode == controlmode.ModePicoclaw && !modeStatus.Transitioning
	runtimeUsable := status.Ready && status.Installed && status.ModelConfigured && !status.Installing
	chat := runtimeUsable && modeStatus.Mode != controlmode.ModeMCP && !modeStatus.Transitioning
	status.Control = ControlStatus{
		Mode:          string(modeStatus.Mode),
		Transitioning: modeStatus.Transitioning,
		CanControl:    canControl,
		LastError:     modeStatus.LastError,
		ChangedAt:     modeStatus.ChangedAt,
	}
	status.Capabilities = RuntimeCapabilities{
		Chat:          chat,
		ReadOnlyTools: chat,
		DeviceWrite:   canControl,
	}
	return status
}

func (s *Service) requireControlMode() *PicoclawError {
	s.ensureDependencies()
	if err := s.control.RequireWrite(controlmode.ModePicoclaw); err != nil {
		return s.controlWriteError(controlmode.ModePicoclaw, err)
	}
	return nil
}

func (s *Service) requireControlModeForBootstrap() *PicoclawError {
	return nil
}

func (s *Service) acquireControlMode() (func(), *PicoclawError) {
	s.ensureDependencies()
	release, err := s.control.AcquireWrite(controlmode.ModePicoclaw)
	if err != nil {
		return nil, s.controlWriteError(controlmode.ModePicoclaw, err)
	}
	return release, nil
}

func (s *Service) controlWriteError(expected controlmode.Mode, err error) *PicoclawError {
	status, statusErr := s.control.Status()
	if statusErr != nil {
		return newPicoclawError(CodeRuntimeUnavailable, statusErr.Error())
	}

	message := "PicoClaw does not own device control"
	code := CodeControlRequired
	if status.Transitioning {
		code = CodeControlTransitioning
		message = "device control is switching"
	} else if expected == controlmode.ModePicoclaw {
		switch status.Mode {
		case controlmode.ModeMCP:
			code = CodeControlOwnedByMCP
			message = "external MCP owns device control"
		case controlmode.ModeOff:
			code = CodeControlRequired
			message = "PicoClaw device control is not enabled"
		default:
			code = CodeControlModeConflict
		}
	}
	controlErr := newPicoclawError(code, message)
	if err != nil && controlErr.Message == "" {
		controlErr.Message = err.Error()
	}
	return controlErr
}

func (s *Service) requireSessionID(c *gin.Context) (string, *PicoclawError) {
	sessionID := c.GetHeader(sessionIDHeader)
	if sessionID == "" {
		return "", newPicoclawError(CodeSessionIDMissing, "missing X-PicoClaw-Session-ID")
	}

	return sessionID, nil
}

func (s *ConfigStore) Get() Config {
	if s == nil {
		return defaultConfig()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config
}

func (s *ConfigStore) Set(cfg Config) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config = cfg
}

func (s *RuntimeStore) Get() RuntimeStatus {
	if s == nil {
		return RuntimeStatus{
			Ready:       false,
			Installed:   false,
			InstallPath: picoclawBinaryPath,
			Status:      "unavailable",
		}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.status
}

func (s *RuntimeStore) Set(status RuntimeStatus) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	status.InstallPath = picoclawBinaryPath
	s.status = status
}

func (s *RuntimeStore) SetFromProbe(status RuntimeStatus) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if isRuntimeLifecycleStatusPending(s.status) && !status.Ready {
		s.status.CheckedAt = status.CheckedAt
		s.status.CurrentSession = status.CurrentSession
		s.status.InstallPath = picoclawBinaryPath
		return
	}

	status.InstallPath = picoclawBinaryPath
	s.status = status
}

func (s *RuntimeStore) Update(update func(*RuntimeStatus)) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	update(&s.status)
	s.status.InstallPath = picoclawBinaryPath
}

func (s *RuntimeStore) UpdateInstallStatus(update func(*RuntimeStatus)) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	update(&s.status)
	s.status.InstallPath = picoclawBinaryPath
}

func isRuntimeLifecycleStatusPending(status RuntimeStatus) bool {
	if status.Restoring {
		return true
	}
	switch status.Status {
	case "starting", "restoring", "stopping":
		return true
	default:
		return false
	}
}

func (s *Service) lockRuntimeLifecycle() func() {
	s.ensureDependencies()
	s.runtimeLifecycleMu.Lock()
	return func() {
		s.runtimeLifecycleMu.Unlock()
	}
}

func (s *Service) ensureRuntimeReady() *PicoclawError {
	return s.ensureRuntimeReadyWithProbeProtection(context.Background(), false)
}

func (s *Service) ensureRuntimeReadyForLifecycle() *PicoclawError {
	return s.ensureRuntimeReadyForLifecycleContext(context.Background())
}

func (s *Service) ensureRuntimeReadyForLifecycleContext(ctx context.Context) *PicoclawError {
	return s.ensureRuntimeReadyWithProbeProtection(ctx, true)
}

func (s *Service) ensureRuntimeReadyWithProbeProtection(ctx context.Context, allowLifecycleOverwrite bool) *PicoclawError {
	if s == nil {
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw service is unavailable")
	}
	if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
		return lifecycleErr
	}
	s.ensureDependencies()
	setStatus := func(status RuntimeStatus) {
		if allowLifecycleOverwrite {
			s.runtime.Set(status)
			return
		}
		s.runtime.SetFromProbe(status)
	}
	currentStatus := s.runtime.Get()
	if currentStatus.Installing {
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw installation is in progress")
	}
	if !allowLifecycleOverwrite && isRuntimeLifecycleStatusPending(currentStatus) {
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw runtime lifecycle operation is pending")
	}
	if !allowLifecycleOverwrite {
		intent, intentErr := s.runtimeIntent.Load()
		if intentErr != nil || !intent.DesiredRunning {
			s.applyDisabledRuntimeIntentStatus()
			if intentErr != nil {
				return newPicoclawError(CodeRuntimeUnavailable, intentErr.Error())
			}
			return newPicoclawError(CodeRuntimeUnavailable, "picoclaw runtime is disabled")
		}
	}

	installed, statErr := isPicoclawInstalled()
	if statErr != nil {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       false,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			Status:          "not_installed",
			LastError:       statErr.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "failed to check picoclaw installation")
	}
	if !installed {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       false,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: false,
			Status:          "not_installed",
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw is not installed")
	}

	configPath, pathErr := resolvePicoclawConfigPath()
	if pathErr != nil {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: false,
			Status:          "model_not_configured",
			LastError:       pathErr.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw model is not configured")
	}
	if _, err := os.Stat(configPath); err != nil {
		if os.IsNotExist(err) {
			if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
				return lifecycleErr
			}
			if _, onboardErr := runPicoclawOnboardContext(ctx); onboardErr != nil {
				setStatus(RuntimeStatus{
					Ready:           false,
					Installed:       true,
					Installing:      false,
					InstallProgress: 0,
					InstallPath:     picoclawBinaryPath,
					ModelConfigured: false,
					Status:          "model_not_configured",
					LastError:       onboardErr.Message,
					CheckedAt:       time.Now(),
					CurrentSession:  s.lock.Owner(),
				})
				return newPicoclawError(CodeRuntimeUnavailable, "picoclaw model is not configured")
			}
			if lifecycleErr := runtimeLifecycleOperationError(ctx); lifecycleErr != nil {
				return lifecycleErr
			}
			if _, statErr := os.Stat(configPath); statErr == nil {
				goto configReady
			}
			setStatus(RuntimeStatus{
				Ready:           false,
				Installed:       true,
				Installing:      false,
				InstallProgress: 0,
				InstallPath:     picoclawBinaryPath,
				ModelConfigured: false,
				Status:          "model_not_configured",
				CheckedAt:       time.Now(),
				CurrentSession:  s.lock.Owner(),
			})
			return newPicoclawError(CodeRuntimeUnavailable, "picoclaw model is not configured")
		}
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: false,
			Status:          "config_error",
			ConfigError:     err.Error(),
			LastError:       err.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway config is invalid")
	}

configReady:
	if syncErr := s.syncConfigFromPicoclaw(); syncErr != nil {
		return syncErr
	}
	settings, settingsErr := loadPicoclawGatewaySettings()
	if settingsErr != nil {
		return newPicoclawError(CodeRuntimeUnavailable, settingsErr.Error())
	}
	if !settings.ModelConfigured {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: false,
			ModelName:       settings.TargetModelName,
			Status:          "model_not_configured",
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw model is not configured")
	}

	running, runningErr := isRuntimeRunning()
	if runningErr != nil {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "unavailable",
			LastError:       runningErr.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "failed to check picoclaw runtime")
	}
	if !running {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "stopped",
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw runtime is stopped")
	}

	cfg := s.config.Get()
	if probeErr := probePicoclawGateway(cfg); probeErr != nil {
		setStatus(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          probeErr.status,
			ConfigError:     probeErr.configError,
			LastError:       probeErr.lastError,
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, probeErr.message)
	}

	setStatus(RuntimeStatus{
		Ready:           true,
		Installed:       true,
		Installing:      false,
		InstallProgress: 100,
		InstallPath:     picoclawBinaryPath,
		ModelConfigured: true,
		ModelName:       settings.ModelName,
		Status:          "ready",
		CheckedAt:       time.Now(),
		CurrentSession:  s.lock.Owner(),
	})
	return nil
}

func (s *Service) startRuntimeProbeLoop() {
	s.ensureDependencies()
	probeLoopOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				_ = s.ensureRuntimeReady()
			}
		}()
	})
}

func shouldRefreshRuntimeStatus(status RuntimeStatus) bool {
	if status.Installing {
		return false
	}
	if status.CheckedAt.IsZero() {
		return true
	}
	return time.Since(status.CheckedAt) >= runtimeStatusRefreshInterval
}

func picoclawInstalledState() (bool, bool) {
	installed, err := isPicoclawInstalled()
	if err != nil {
		return false, false
	}
	return installed, true
}

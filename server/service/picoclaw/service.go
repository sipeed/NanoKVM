package picoclaw

import (
	"net"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/service/hid"

	"github.com/gin-gonic/gin"
)

const sessionIDHeader = "X-PicoClaw-Session-ID"

var (
	configStoreOnce  sync.Once
	configStore      *ConfigStore
	runtimeStoreOnce sync.Once
	runtimeStore     *RuntimeStore
	probeLoopOnce    sync.Once
)

func NewService() *Service {
	return &Service{
		vision:  common.GetKvmVision(),
		hid:     hid.GetHid(),
		config:  getConfigStore(),
		lock:    GetSessionLock(),
		runtime: getRuntimeStore(),
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

func (s *Service) GetConfig(c *gin.Context) {
	s.startRuntimeProbeLoop()
	_ = s.syncConfigFromPicoclaw()
	cfg := s.config.Get()
	writeSuccess(c, cfg.toResponse())
}

func (s *Service) UpdateConfig(c *gin.Context) {
	var req ConfigUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    CodeInvalidAction,
			"message": "invalid config payload",
		})
		return
	}

	cfg := s.config.Get()
	if req.GatewayURL != nil {
		cfg.GatewayURL = *req.GatewayURL
	}
	if req.ConnectTimeoutMs != nil && *req.ConnectTimeoutMs > 0 {
		cfg.ConnectTimeoutMs = *req.ConnectTimeoutMs
	}
	if req.ReadTimeoutMs != nil && *req.ReadTimeoutMs > 0 {
		cfg.ReadTimeoutMs = *req.ReadTimeoutMs
	}
	if req.WriteTimeoutMs != nil && *req.WriteTimeoutMs > 0 {
		cfg.WriteTimeoutMs = *req.WriteTimeoutMs
	}
	if req.PingIntervalMs != nil && *req.PingIntervalMs > 0 {
		cfg.PingIntervalMs = *req.PingIntervalMs
	}
	if req.MaxMessageBytes != nil && *req.MaxMessageBytes > 0 {
		cfg.MaxMessageBytes = *req.MaxMessageBytes
	}
	if req.AllowTokenQuery != nil {
		cfg.AllowTokenQuery = *req.AllowTokenQuery
	}
	if req.Token != nil {
		cfg.Token = *req.Token
	}

	s.config.Set(cfg)
	_ = s.syncConfigFromPicoclaw()
	_ = s.ensureRuntimeReady()
	writeSuccess(c, s.config.Get().toResponse())
}

func (s *Service) GetRuntimeStatus(c *gin.Context) {
	s.startRuntimeProbeLoop()
	_ = s.ensureRuntimeReady()
	writeSuccess(c, withAgentProfile(s.runtime.Get()))
}

func (s *Service) GetRuntimeSession(c *gin.Context) {
	writeSuccess(c, gin.H{
		"current_session": s.lock.Owner(),
		"checked_at":      time.Now(),
	})
}

func (s *Service) requireSessionID(c *gin.Context) (string, *PicoclawError) {
	sessionID := c.GetHeader(sessionIDHeader)
	if sessionID == "" {
		return "", newPicoclawError(CodeSessionIDMissing, "missing X-PicoClaw-Session-ID")
	}

	if err := s.lock.Ensure(sessionID); err != nil {
		return "", err
	}

	return sessionID, nil
}

func (c Config) toResponse() ConfigResponse {
	return ConfigResponse{
		GatewayURL:       c.GatewayURL,
		ConnectTimeoutMs: c.ConnectTimeoutMs,
		ReadTimeoutMs:    c.ReadTimeoutMs,
		WriteTimeoutMs:   c.WriteTimeoutMs,
		PingIntervalMs:   c.PingIntervalMs,
		MaxMessageBytes:  c.MaxMessageBytes,
		AllowTokenQuery:  c.AllowTokenQuery,
		TokenConfigured:  c.Token != "",
	}
}

func (s *ConfigStore) Get() Config {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config
}

func (s *ConfigStore) Set(cfg Config) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config = cfg
}

func (s *RuntimeStore) Get() RuntimeStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.status
}

func (s *RuntimeStore) Set(status RuntimeStatus) {
	s.mu.Lock()
	defer s.mu.Unlock()
	status.InstallPath = picoclawBinaryPath
	s.status = status
}

func (s *RuntimeStore) Update(update func(*RuntimeStatus)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	update(&s.status)
	s.status.InstallPath = picoclawBinaryPath
}

func (s *RuntimeStore) UpdateInstallStatus(update func(*RuntimeStatus)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	update(&s.status)
	s.status.InstallPath = picoclawBinaryPath
}

func (s *Service) ensureRuntimeReady() *PicoclawError {
	currentStatus := s.runtime.Get()
	if currentStatus.Installing {
		return newPicoclawError(CodeRuntimeUnavailable, "picoclaw installation is in progress")
	}

	installed, statErr := isPicoclawInstalled()
	if statErr != nil {
		s.runtime.Set(RuntimeStatus{
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
		s.runtime.Set(RuntimeStatus{
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
		s.runtime.Set(RuntimeStatus{
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
			if _, onboardErr := runPicoclawOnboard(); onboardErr != nil {
				s.runtime.Set(RuntimeStatus{
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
			if _, statErr := os.Stat(configPath); statErr == nil {
				goto configReady
			}
			s.runtime.Set(RuntimeStatus{
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
		s.runtime.Set(RuntimeStatus{
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
	if patchErr := ensurePicoclawNanoKVMDefaults(); patchErr != nil {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: false,
			Status:          "config_error",
			ConfigError:     patchErr.Error(),
			LastError:       patchErr.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway config is invalid")
	}
	if syncErr := s.syncConfigFromPicoclaw(); syncErr != nil {
		return syncErr
	}
	settings, settingsErr := loadPicoclawGatewaySettings()
	if settingsErr != nil {
		return newPicoclawError(CodeRuntimeUnavailable, settingsErr.Error())
	}
	if !settings.ModelConfigured {
		s.runtime.Set(RuntimeStatus{
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

	cfg := s.config.Get()

	parsed, err := url.Parse(cfg.GatewayURL)
	if err != nil {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "config_error",
			ConfigError:     "invalid gateway url",
			LastError:       err.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway config is invalid")
	}
	if parsed.Scheme != "ws" && parsed.Scheme != "wss" {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "config_error",
			ConfigError:     "invalid gateway url scheme",
			LastError:       parsed.Scheme,
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway config is invalid")
	}

	timeout := time.Duration(cfg.ConnectTimeoutMs) * time.Millisecond
	hostPort, err := gatewayHostPort(parsed)
	if err != nil {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "config_error",
			ConfigError:     err.Error(),
			LastError:       err.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway config is invalid")
	}

	conn, err := net.DialTimeout("tcp", hostPort, timeout)
	if err != nil {
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 0,
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: true,
			ModelName:       settings.ModelName,
			Status:          "unavailable",
			LastError:       err.Error(),
			CheckedAt:       time.Now(),
			CurrentSession:  s.lock.Owner(),
		})
		return newPicoclawError(CodeRuntimeUnavailable, "gateway is unavailable")
	}
	_ = conn.Close()

	s.runtime.Set(RuntimeStatus{
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
	probeLoopOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()

			_ = s.ensureRuntimeReady()
			for range ticker.C {
				_ = s.ensureRuntimeReady()
			}
		}()
	})
}

package picoclaw

import (
	"fmt"
	"os"
	"strings"
	"time"
)

const (
	defaultPicoclawGatewayHost = "127.0.0.1"
	defaultPicoclawGatewayPort = 18790
	picoclawGatewayPath        = "/pico/ws"
)

func defaultConfig() Config {
	cfg := Config{
		GatewayURL:       "ws://127.0.0.1:18790/pico/ws",
		ConnectTimeoutMs: 10000,
		ReadTimeoutMs:    60000,
		WriteTimeoutMs:   10000,
		PingIntervalMs:   30000,
		MaxMessageBytes:  1024 * 1024,
		AllowTokenQuery:  false,
	}

	settings, err := loadPicoclawGatewaySettings()
	if err != nil {
		return cfg
	}

	cfg.GatewayURL = settings.GatewayURL
	cfg.Token = settings.Token
	cfg.AllowTokenQuery = settings.AllowTokenQuery
	if settings.PingIntervalMs > 0 {
		cfg.PingIntervalMs = settings.PingIntervalMs
	}
	if settings.ReadTimeoutMs > 0 {
		cfg.ReadTimeoutMs = settings.ReadTimeoutMs
	}

	return cfg
}

func (s *Service) syncConfigFromPicoclaw() *PicoclawError {
	installed, installedKnown := picoclawInstalledState()

	if patchErr := preparePicoclawConfigForRead(); patchErr != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "config_error"
			status.ConfigError = patchErr.Error()
			status.LastError = patchErr.Error()
			if installedKnown {
				status.Installed = installed
			}
			status.CheckedAt = time.Now()
		})
		return newPicoclawError(CodeRuntimeUnavailable, patchErr.Error())
	}

	settings, err := loadPicoclawGatewaySettings()
	if err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "config_error"
			status.ConfigError = err.Error()
			status.LastError = err.Error()
			if installedKnown {
				status.Installed = installed
			}
			status.CheckedAt = time.Now()
		})
		return newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}

	cfg := s.config.Get()
	cfg.GatewayURL = settings.GatewayURL
	cfg.Token = settings.Token
	cfg.AllowTokenQuery = settings.AllowTokenQuery
	if settings.PingIntervalMs > 0 {
		cfg.PingIntervalMs = settings.PingIntervalMs
	}
	if settings.ReadTimeoutMs > 0 {
		cfg.ReadTimeoutMs = settings.ReadTimeoutMs
	}
	s.config.Set(cfg)

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Installed = true
		status.ModelConfigured = settings.ModelConfigured
		if settings.ModelConfigured {
			status.ModelName = settings.ModelName
		} else {
			status.ModelName = settings.TargetModelName
		}
		status.ConfigError = ""
		if status.Status == "config_error" && status.Ready {
			status.Status = "ready"
		}
		status.CheckedAt = time.Now()
	})

	return nil
}

type picoclawGatewaySettings struct {
	GatewayURL      string
	Token           string
	AllowTokenQuery bool
	PingIntervalMs  int
	ReadTimeoutMs   int
	ModelConfigured bool
	ModelName       string
	TargetModelName string
}

func loadPicoclawGatewaySettings() (picoclawGatewaySettings, error) {
	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return picoclawGatewaySettings{}, err
	}
	if err := ensurePicoclawPicoChannelEnabled(doc); err != nil {
		return picoclawGatewaySettings{}, err
	}

	cfg := doc.config

	host := cfg.Gateway.Host
	if host == "" || host == "0.0.0.0" {
		host = defaultPicoclawGatewayHost
	}

	port := cfg.Gateway.Port
	if port <= 0 {
		port = defaultPicoclawGatewayPort
	}

	settings := picoclawGatewaySettings{
		GatewayURL:      fmt.Sprintf("ws://%s:%d%s", host, port, picoclawGatewayPath),
		Token:           doc.resolvedGatewayToken(),
		AllowTokenQuery: cfg.Channels.Pico.AllowTokenQuery,
	}
	settings.TargetModelName = resolvePicoclawTargetModelName(cfg)

	if isPicoclawModelConfigured(cfg, doc.security, settings.TargetModelName) {
		settings.ModelConfigured = true
		settings.ModelName = settings.TargetModelName
	}

	if cfg.Channels.Pico.PingInterval > 0 {
		settings.PingIntervalMs = cfg.Channels.Pico.PingInterval * 1000
	}
	if cfg.Channels.Pico.ReadTimeout > 0 {
		settings.ReadTimeoutMs = cfg.Channels.Pico.ReadTimeout * 1000
	}

	return settings, nil
}

func resolvePicoclawTargetModelName(cfg picoclawConfigFile) string {
	return strings.TrimSpace(cfg.Agents.Defaults.ModelName)
}

func preparePicoclawConfigForRead() error {
	configPath, err := resolvePicoclawConfigPath()
	if err != nil {
		return err
	}

	if _, err := os.Stat(configPath); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("failed to stat picoclaw config: %w", err)
	}

	return nil
}

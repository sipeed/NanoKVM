package application

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	UpdateServerConfigFile = "/etc/kvm/application-update.json"
	maxUpdateServerURLSize = 2048
)

var (
	updateServerConfigMu   sync.Mutex
	updateServerConfigPath = UpdateServerConfigFile
)

type UpdateServerConfig struct {
	Enabled bool   `json:"enabled"`
	URL     string `json:"url"`
}

func defaultUpdateServerConfig() UpdateServerConfig {
	return UpdateServerConfig{URL: StableURL}
}

func (s *Service) GetUpdateServer(c *gin.Context) {
	var rsp proto.Response

	cfg, err := loadUpdateServerConfig()
	if err != nil {
		log.Errorf("failed to load update server config: %s", err)
		rsp.ErrRsp(c, -1, "failed to load update server config")
		return
	}

	rsp.OkRspWithData(c, &proto.GetUpdateServerRsp{
		Enabled: cfg.Enabled,
		URL:     cfg.URL,
	})
}

func (s *Service) SetUpdateServer(c *gin.Context) {
	var req proto.SetUpdateServerReq
	var rsp proto.Response

	// Avoid the shared request logger because the URL may contain credentials.
	if err := c.ShouldBind(&req); err != nil || req.Enabled == nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	normalizedURL, err := normalizeUpdateServerURL(req.URL)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	if *req.Enabled && normalizedURL == "" {
		rsp.ErrRsp(c, -2, "update server URL is required")
		return
	}
	if normalizedURL == "" {
		normalizedURL = StableURL
	}

	cfg := UpdateServerConfig{Enabled: *req.Enabled, URL: normalizedURL}
	if err := saveUpdateServerConfig(cfg); err != nil {
		log.Errorf("failed to save update server config: %s", err)
		rsp.ErrRsp(c, -3, "failed to save update server config")
		return
	}

	rsp.OkRspWithData(c, &proto.GetUpdateServerRsp{
		Enabled: cfg.Enabled,
		URL:     cfg.URL,
	})
}

func resolveUpdateBaseURL() (string, error) {
	cfg, err := loadUpdateServerConfig()
	if err != nil {
		return "", err
	}
	if cfg.Enabled {
		return cfg.URL, nil
	}
	if isPreviewEnabled() {
		return PreviewURL, nil
	}
	return StableURL, nil
}

func normalizeUpdateServerURL(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", nil
	}
	if len(raw) > maxUpdateServerURLSize {
		return "", errors.New("update server URL is too long")
	}

	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return "", errors.New("invalid update server URL")
	}
	if parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", errors.New("update server URL must not contain a query or fragment")
	}
	if strings.HasSuffix(strings.TrimRight(parsed.Path, "/"), "/latest.json") {
		return "", errors.New("enter the update server directory, not latest.json")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/")
	return parsed.String(), nil
}

func loadUpdateServerConfig() (UpdateServerConfig, error) {
	updateServerConfigMu.Lock()
	defer updateServerConfigMu.Unlock()

	return loadUpdateServerConfigFromPath(updateServerConfigPath)
}

func loadUpdateServerConfigFromPath(path string) (UpdateServerConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return defaultUpdateServerConfig(), nil
		}
		return UpdateServerConfig{}, err
	}

	var cfg UpdateServerConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return UpdateServerConfig{}, fmt.Errorf("decode update server config: %w", err)
	}

	normalizedURL, err := normalizeUpdateServerURL(cfg.URL)
	if err != nil {
		return UpdateServerConfig{}, err
	}
	if normalizedURL == "" {
		normalizedURL = StableURL
	}
	cfg.URL = normalizedURL
	return cfg, nil
}

func saveUpdateServerConfig(cfg UpdateServerConfig) error {
	updateServerConfigMu.Lock()
	defer updateServerConfigMu.Unlock()

	return saveUpdateServerConfigToPath(updateServerConfigPath, cfg)
}

func saveUpdateServerConfigToPath(path string, cfg UpdateServerConfig) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create update server config directory: %w", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("encode update server config: %w", err)
	}
	data = append(data, '\n')

	tmp, err := os.CreateTemp(dir, ".application-update.json.*")
	if err != nil {
		return fmt.Errorf("create temporary update server config: %w", err)
	}
	tmpPath := tmp.Name()
	defer func() { _ = os.Remove(tmpPath) }()

	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("set update server config permissions: %w", err)
	}
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write update server config: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("sync update server config: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close update server config: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("replace update server config: %w", err)
	}

	directory, err := os.Open(dir)
	if err == nil {
		_ = directory.Sync()
		_ = directory.Close()
	}

	return nil
}

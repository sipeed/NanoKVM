package mcpservice

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

const (
	ConfigFile   = "/etc/kvm/mcp.json"
	apiKeyPrefix = "nag_mcp_"
	apiKeyBytes  = 32
)

var (
	configMu       sync.Mutex
	configFilePath = ConfigFile
)

type Config struct {
	APIKey string `json:"apiKey"`
}

func loadConfig() (Config, error) {
	configMu.Lock()
	defer configMu.Unlock()

	return loadConfigFromPath(configFilePath)
}

func updateConfig(update func(Config) (Config, error)) (Config, error) {
	configMu.Lock()
	defer configMu.Unlock()

	cfg, err := loadConfigFromPath(configFilePath)
	if err != nil {
		return Config{}, err
	}

	updated, err := update(cfg)
	if err != nil {
		return Config{}, err
	}
	if err := saveConfigToPath(configFilePath, updated); err != nil {
		return Config{}, err
	}

	return updated, nil
}

func loadConfigFromPath(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return Config{}, nil
		}
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, fmt.Errorf("decode MCP config: %w", err)
	}
	return cfg, nil
}

func saveConfigToPath(path string, cfg Config) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create MCP config directory: %w", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("encode MCP config: %w", err)
	}
	data = append(data, '\n')

	tmp, err := os.CreateTemp(dir, ".mcp.json.*")
	if err != nil {
		return fmt.Errorf("create temporary MCP config: %w", err)
	}
	tmpPath := tmp.Name()
	defer func() { _ = os.Remove(tmpPath) }()

	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("set temporary MCP config permissions: %w", err)
	}
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write temporary MCP config: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("sync temporary MCP config: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temporary MCP config: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("replace MCP config: %w", err)
	}
	if err := os.Chmod(path, 0o600); err != nil {
		return fmt.Errorf("set MCP config permissions: %w", err)
	}

	directory, err := os.Open(dir)
	if err == nil {
		if syncErr := directory.Sync(); syncErr != nil {
			_ = directory.Close()
			return fmt.Errorf("sync MCP config directory: %w", syncErr)
		}
		_ = directory.Close()
	}

	return nil
}

func ensureAPIKey(cfg Config) (Config, error) {
	if cfg.APIKey != "" {
		return cfg, nil
	}

	key, err := generateAPIKey()
	if err != nil {
		return Config{}, err
	}
	cfg.APIKey = key
	return cfg, nil
}

func regenerateAPIKey(cfg Config) (Config, error) {
	key, err := generateAPIKey()
	if err != nil {
		return Config{}, err
	}
	cfg.APIKey = key
	return cfg, nil
}

func generateAPIKey() (string, error) {
	raw := make([]byte, apiKeyBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate MCP API key: %w", err)
	}

	return apiKeyPrefix + base64.RawURLEncoding.EncodeToString(raw), nil
}

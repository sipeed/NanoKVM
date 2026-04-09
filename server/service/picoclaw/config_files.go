package picoclaw

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

const (
	picoclawPIDFileName        = ".picoclaw.pid"
	picoclawGatewayTokenPrefix = "pico-"
)

type picoclawConfigFile struct {
	Agents struct {
		Defaults struct {
			ModelName string `json:"model_name"`
			Model     string `json:"model,omitempty"`
			Workspace string `json:"workspace,omitempty"`
		} `json:"defaults"`
	} `json:"agents"`
	Gateway struct {
		Host string `json:"host"`
		Port int    `json:"port"`
	} `json:"gateway"`
	ModelList []struct {
		ModelName string   `json:"model_name"`
		Model     string   `json:"model"`
		APIBase   string   `json:"api_base"`
		APIKey    string   `json:"api_key"`
		APIKeys   []string `json:"api_keys,omitempty"`
	} `json:"model_list"`
	Channels struct {
		Pico struct {
			Enabled         bool   `json:"enabled"`
			Token           string `json:"token"`
			AllowTokenQuery bool   `json:"allow_token_query"`
			PingInterval    int    `json:"ping_interval"`
			ReadTimeout     int    `json:"read_timeout"`
		} `json:"pico"`
	} `json:"channels"`
}

type picoclawConfigDocument struct {
	configPath   string
	securityPath string
	config       picoclawConfigFile
	raw          map[string]any
	security     picoclawSecurityConfig
}

func loadPicoclawConfigDocument() (*picoclawConfigDocument, error) {
	configPath, err := resolvePicoclawConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read picoclaw config: %w", err)
	}

	var cfg picoclawConfigFile
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse picoclaw config: %w", err)
	}

	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("failed to parse picoclaw config for update: %w", err)
	}

	securityPath := resolvePicoclawSecurityPath(configPath)
	security, err := loadPicoclawSecurityConfig(securityPath)
	if err != nil {
		return nil, err
	}

	return &picoclawConfigDocument{
		configPath:   configPath,
		securityPath: securityPath,
		config:       cfg,
		raw:          raw,
		security:     security,
	}, nil
}

func resolvePicoclawConfigPath() (string, error) {
	home := os.Getenv("PICOCLAW_HOME")
	if home == "" {
		currentUser, err := user.Current()
		if err != nil {
			return "", fmt.Errorf("failed to resolve PICOCLAW_HOME: %w", err)
		}
		home = filepath.Join(currentUser.HomeDir, ".picoclaw")
	}

	return filepath.Join(home, "config.json"), nil
}

func expandPicoclawPath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}

	if strings.HasPrefix(path, "~/") || path == "~" {
		if home, err := os.UserHomeDir(); err == nil {
			if path == "~" {
				return home
			}
			return filepath.Join(home, strings.TrimPrefix(path, "~/"))
		}
	}

	return path
}

func resolvePicoclawSecurityPath(configPath string) string {
	return filepath.Join(filepath.Dir(configPath), ".security.yml")
}

func (d *picoclawConfigDocument) saveConfig() error {
	updated, err := json.MarshalIndent(d.raw, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode updated picoclaw config: %w", err)
	}
	if err := os.WriteFile(d.configPath, updated, 0o600); err != nil {
		return fmt.Errorf("failed to write picoclaw config: %w", err)
	}
	return nil
}

func (d *picoclawConfigDocument) saveSecurity() error {
	var buf bytes.Buffer
	encoder := yaml.NewEncoder(&buf)
	encoder.SetIndent(2)
	if err := encoder.Encode(d.security); err != nil {
		return fmt.Errorf("failed to encode picoclaw security config: %w", err)
	}
	if err := encoder.Close(); err != nil {
		return fmt.Errorf("failed to finalize picoclaw security config: %w", err)
	}
	if err := os.WriteFile(d.securityPath, buf.Bytes(), 0o600); err != nil {
		return fmt.Errorf("failed to write picoclaw security config: %w", err)
	}
	return nil
}

type picoclawSecurityConfig struct {
	ModelList map[string]picoclawModelSecurityEntry `yaml:"model_list,omitempty"`
	Channels  picoclawSecurityChannels              `yaml:"channels,omitempty"`
}

type picoclawModelSecurityEntry struct {
	APIKeys []string `yaml:"api_keys,omitempty"`
}

type picoclawSecurityChannels struct {
	Pico *picoclawPicoSecurity `yaml:"pico,omitempty"`
}

type picoclawPicoSecurity struct {
	Token string `yaml:"token,omitempty"`
}

type picoclawPIDFile struct {
	Token string `json:"token"`
}

func (d *picoclawConfigDocument) resolvedPicoToken() string {
	if d == nil {
		return ""
	}
	if d.security.Channels.Pico != nil {
		if token := d.security.Channels.Pico.Token; token != "" {
			return token
		}
	}
	return d.config.Channels.Pico.Token
}

func (d *picoclawConfigDocument) resolvedGatewayToken() string {
	baseToken := strings.TrimSpace(d.resolvedPicoToken())
	if baseToken == "" {
		return ""
	}

	runtimeToken, err := d.resolvedPIDToken()
	if err != nil {
		return baseToken
	}

	return composePicoclawGatewayToken(baseToken, runtimeToken)
}

func (d *picoclawConfigDocument) resolvedPIDToken() (string, error) {
	if d == nil || d.configPath == "" {
		return "", nil
	}

	pidPath := filepath.Join(filepath.Dir(d.configPath), picoclawPIDFileName)
	data, err := os.ReadFile(pidPath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", fmt.Errorf("failed to read picoclaw pid file: %w", err)
	}

	var pidFile picoclawPIDFile
	if err := json.Unmarshal(data, &pidFile); err != nil {
		return "", fmt.Errorf("failed to parse picoclaw pid file: %w", err)
	}

	return strings.TrimSpace(pidFile.Token), nil
}

func composePicoclawGatewayToken(baseToken, runtimeToken string) string {
	baseToken = strings.TrimSpace(baseToken)
	runtimeToken = strings.TrimSpace(runtimeToken)

	switch {
	case baseToken == "":
		return ""
	case strings.HasPrefix(baseToken, picoclawGatewayTokenPrefix):
		return baseToken
	case runtimeToken == "":
		return baseToken
	default:
		return picoclawGatewayTokenPrefix + runtimeToken + baseToken
	}
}

func loadPicoclawSecurityConfig(securityPath string) (picoclawSecurityConfig, error) {
	data, err := os.ReadFile(securityPath)
	if err != nil {
		if os.IsNotExist(err) {
			return picoclawSecurityConfig{}, nil
		}
		return picoclawSecurityConfig{}, fmt.Errorf("failed to read picoclaw security config: %w", err)
	}

	var sec picoclawSecurityConfig
	if err := yaml.Unmarshal(data, &sec); err != nil {
		return picoclawSecurityConfig{}, fmt.Errorf("failed to parse picoclaw security config: %w", err)
	}

	return sec, nil
}

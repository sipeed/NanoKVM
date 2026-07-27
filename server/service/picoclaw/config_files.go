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
	Channels map[string]picoclawChannelEntry `json:"channel_list"`
}

type picoclawChannelEntry struct {
	Type     string                 `json:"type"`
	Enabled  bool                   `json:"enabled"`
	Settings picoclawPicoSettingsV3 `json:"settings"`
}

type picoclawPicoSettingsV3 struct {
	Token           string `json:"token,omitempty"`
	AllowTokenQuery bool   `json:"allow_token_query,omitempty"`
	PingInterval    int    `json:"ping_interval,omitempty"`
	ReadTimeout     int    `json:"read_timeout,omitempty"`
	WriteTimeout    int    `json:"write_timeout,omitempty"`
	MaxConnections  int    `json:"max_connections,omitempty"`
}

type picoclawConfigDocument struct {
	configPath   string
	securityPath string
	config       picoclawConfigFile
	raw          map[string]any
	security     picoclawSecurityConfig
	securityRaw  map[string]any
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
	securityRaw, err := loadPicoclawSecurityRaw(securityPath)
	if err != nil {
		return nil, err
	}

	return &picoclawConfigDocument{
		configPath:   configPath,
		securityPath: securityPath,
		config:       cfg,
		raw:          raw,
		security:     security,
		securityRaw:  securityRaw,
	}, nil
}

// loadPicoclawSecurityRaw reads .security.yml into an untyped map so unrelated
// top-level sections survive a save. Returns nil (not an error) when absent.
func loadPicoclawSecurityRaw(securityPath string) (map[string]any, error) {
	data, err := os.ReadFile(securityPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to read picoclaw security config: %w", err)
	}
	var raw map[string]any
	if err := yaml.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("failed to parse picoclaw security config for update: %w", err)
	}
	return raw, nil
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
	output, err := d.encodeSecurity()
	if err != nil {
		return err
	}
	if err := os.WriteFile(d.securityPath, output, 0o600); err != nil {
		return fmt.Errorf("failed to write picoclaw security config: %w", err)
	}
	return nil
}

// encodeSecurity serializes the security config while preserving any top-level
// keys present in the original .security.yml that our typed view does not model.
// The typed model_list/channel_list (the only sections we mutate) are written
// back over the preserved raw map; an absent raw map falls back to the typed
// struct (e.g. when the file did not previously exist).
func (d *picoclawConfigDocument) encodeSecurity() ([]byte, error) {
	if d.securityRaw == nil {
		return marshalSecurityYAML(d.security)
	}

	typedMap, err := securityToMap(d.security)
	if err != nil {
		return nil, err
	}
	for _, key := range []string{"model_list", "channel_list"} {
		if value, ok := typedMap[key]; ok {
			d.securityRaw[key] = value
		} else {
			delete(d.securityRaw, key)
		}
	}
	return marshalSecurityYAML(d.securityRaw)
}

func securityToMap(sec picoclawSecurityConfig) (map[string]any, error) {
	data, err := yaml.Marshal(sec)
	if err != nil {
		return nil, fmt.Errorf("failed to encode picoclaw security config: %w", err)
	}
	out := map[string]any{}
	if err := yaml.Unmarshal(data, &out); err != nil {
		return nil, fmt.Errorf("failed to normalize picoclaw security config: %w", err)
	}
	return out, nil
}

func marshalSecurityYAML(value any) ([]byte, error) {
	var buf bytes.Buffer
	encoder := yaml.NewEncoder(&buf)
	encoder.SetIndent(2)
	if err := encoder.Encode(value); err != nil {
		return nil, fmt.Errorf("failed to encode picoclaw security config: %w", err)
	}
	if err := encoder.Close(); err != nil {
		return nil, fmt.Errorf("failed to finalize picoclaw security config: %w", err)
	}
	return buf.Bytes(), nil
}

type picoclawSecurityConfig struct {
	ModelList   map[string]picoclawModelSecurityEntry   `yaml:"model_list,omitempty"`
	ChannelList map[string]picoclawChannelSecurityEntry `yaml:"channel_list,omitempty"`
}

type picoclawModelSecurityEntry struct {
	APIKeys []string `yaml:"api_keys,omitempty"`
}

type picoclawChannelSecurityEntry struct {
	Token    string                           `yaml:"token,omitempty"`
	Settings *picoclawChannelSecuritySettings `yaml:"settings,omitempty"`
}

type picoclawChannelSecuritySettings struct {
	Token string `yaml:"token,omitempty"`
}

func (d *picoclawConfigDocument) resolvedPicoToken() string {
	if d == nil {
		return ""
	}
	// Check security config (channel_list.pico with nested settings)
	if entry, ok := d.security.ChannelList["pico"]; ok {
		if entry.Settings != nil && entry.Settings.Token != "" {
			return entry.Settings.Token
		}
		if entry.Token != "" {
			return entry.Token
		}
	}
	// Fall back to config.json channel_list.pico.settings.token
	if pico, ok := d.config.Channels["pico"]; ok {
		return pico.Settings.Token
	}
	return ""
}

func (d *picoclawConfigDocument) resolvedGatewayToken() string {
	return strings.TrimSpace(d.resolvedPicoToken())
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

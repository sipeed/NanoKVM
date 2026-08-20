package config

import (
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"sync"

	"gopkg.in/yaml.v3"
)

const (
	PicoclawInternalTokenHeader = "X-NanoKVM-Internal-Token"
	picoclawInternalTokenFile   = "/etc/kvm/.picoclaw_internal_token"
)

var picoclawInternalToken struct {
	mu    sync.Mutex
	value string
}

func GetPicoclawInternalToken() (string, error) {
	picoclawInternalToken.mu.Lock()
	defer picoclawInternalToken.mu.Unlock()

	// Always try to read the live pico token from security.yml first
	if token := readPicoclawSecurityToken(); token != "" {
		picoclawInternalToken.value = token
		return token, nil
	}

	// Fall back to cached value
	if picoclawInternalToken.value != "" {
		return picoclawInternalToken.value, nil
	}

	// Fall back to the legacy token file
	if token, err := readPicoclawInternalToken(); err == nil {
		if token != "" {
			picoclawInternalToken.value = token
			return token, nil
		}
	} else if !os.IsNotExist(err) {
		return "", err
	}

	token := generateRandomSecretKey()
	if err := os.MkdirAll(filepath.Dir(picoclawInternalTokenFile), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(picoclawInternalTokenFile, []byte(token+"\n"), 0o600); err != nil {
		return "", err
	}

	picoclawInternalToken.value = token
	return token, nil
}

func EnsurePicoclawInternalToken() error {
	_, err := GetPicoclawInternalToken()
	return err
}

func readPicoclawInternalToken() (string, error) {
	data, err := os.ReadFile(picoclawInternalTokenFile)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(data)), nil
}

type picoclawSecurityYAML struct {
	ChannelList map[string]struct {
		Token    string `yaml:"token,omitempty"`
		Settings *struct {
			Token string `yaml:"token,omitempty"`
		} `yaml:"settings,omitempty"`
	} `yaml:"channel_list,omitempty"`
}

func readPicoclawSecurityToken() string {
	home := os.Getenv("PICOCLAW_HOME")
	if home == "" {
		u, err := user.Current()
		if err != nil {
			return ""
		}
		home = filepath.Join(u.HomeDir, ".picoclaw")
	}

	data, err := os.ReadFile(filepath.Join(home, ".security.yml"))
	if err != nil {
		return ""
	}

	var sec picoclawSecurityYAML
	if err := yaml.Unmarshal(data, &sec); err != nil {
		return ""
	}

	entry, ok := sec.ChannelList["pico"]
	if !ok {
		return ""
	}
	if entry.Settings != nil {
		if t := strings.TrimSpace(entry.Settings.Token); t != "" {
			return t
		}
	}
	return strings.TrimSpace(entry.Token)
}

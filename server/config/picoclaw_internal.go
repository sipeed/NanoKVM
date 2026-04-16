package config

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
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

	if picoclawInternalToken.value != "" {
		return picoclawInternalToken.value, nil
	}

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

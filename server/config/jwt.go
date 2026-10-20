package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const jwtSecretFile = "/etc/kvm/.jwt_secret"

// Generate random string for secret key.
func generateRandomSecretKey() string {
	b := make([]byte, 64)
	_, err := rand.Read(b)
	if err != nil {
		currentTime := time.Now().UnixNano()
		timeString := fmt.Sprintf("%d", currentTime)
		return fmt.Sprintf("%064s", timeString)
	}

	return base64.URLEncoding.EncodeToString(b)
}

func loadOrCreateJWTSecret(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err == nil {
		if secret := strings.TrimSpace(string(data)); secret != "" {
			if err = os.Chmod(path, 0o600); err != nil {
				return "", err
			}
			return secret, nil
		}
	} else if !os.IsNotExist(err) {
		return "", err
	}

	secret := generateRandomSecretKey()
	directory := filepath.Dir(path)
	if err = os.MkdirAll(directory, 0o755); err != nil {
		return "", err
	}

	temporary, err := os.CreateTemp(directory, ".jwt-secret-*")
	if err != nil {
		return "", err
	}
	temporaryPath := temporary.Name()
	removeTemporary := true
	defer func() {
		_ = temporary.Close()
		if removeTemporary {
			_ = os.Remove(temporaryPath)
		}
	}()

	if err = temporary.Chmod(0o600); err != nil {
		return "", err
	}
	if _, err = temporary.WriteString(secret + "\n"); err != nil {
		return "", err
	}
	if err = temporary.Sync(); err != nil {
		return "", err
	}
	if err = temporary.Close(); err != nil {
		return "", err
	}
	if err = os.Rename(temporaryPath, path); err != nil {
		return "", err
	}
	removeTemporary = false
	return secret, nil
}

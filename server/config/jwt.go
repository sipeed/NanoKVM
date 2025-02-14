package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"
)

// RegenerateSecretKey regenerate secret key when logout
func RegenerateSecretKey() {
	if instance.JWT.RevokeTokensOnLogout {
		instance.JWT.SecretKey = generateRandomSecretKey()
	}
}

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

package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"log"
)

// RegenerateSecretKey regenerate secret key when logout.
//
// A rotation that cannot produce a key leaves the working one in place. The
// outstanding tokens stay valid, which is the lesser of the two failures: the
// alternative is signing with something guessable.
func RegenerateSecretKey() {
	if !instance.JWT.RevokeTokensOnLogout {
		return
	}

	key, err := generateSecretKey()
	if err != nil {
		log.Printf("keeping the current secret key: %s", err)
		return
	}

	instance.JWT.SecretKey = key
}

// secretKeyReader is the entropy source. Tests replace it to exercise the
// failure path.
var secretKeyReader io.Reader = rand.Reader

func generateSecretKey() (string, error) {
	b := make([]byte, 64)

	if _, err := io.ReadFull(secretKeyReader, b); err != nil {
		// There is no safe fallback. Anything derived from the clock is a key
		// an attacker can search, because they know roughly when the device
		// booted, so this has to fail instead.
		return "", fmt.Errorf("failed to read random bytes for the secret key: %w", err)
	}

	return base64.URLEncoding.EncodeToString(b), nil
}

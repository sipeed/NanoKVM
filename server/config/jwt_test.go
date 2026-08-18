package config

import (
	"errors"
	"strings"
	"testing"
)

type failingReader struct{}

func (failingReader) Read([]byte) (int, error) {
	return 0, errors.New("no entropy")
}

// Falling back to anything derived from the clock would hand an attacker a
// signing key they can search: the device boots, and the key is the nanosecond
// it happened to boot at.
func TestGenerateSecretKeyFailsRatherThanReturningAPredictableValue(t *testing.T) {
	original := secretKeyReader
	t.Cleanup(func() { secretKeyReader = original })
	secretKeyReader = failingReader{}

	key, err := generateSecretKey()

	if err == nil {
		t.Fatalf("expected an error, got key %q", key)
	}
	if key != "" {
		t.Fatalf("expected no key on failure, got %q", key)
	}
}

func TestGenerateSecretKeyReturnsADifferentKeyEachTime(t *testing.T) {
	// No override: this exercises the real crypto/rand source.
	first, err := generateSecretKey()
	if err != nil {
		t.Fatalf("failed to generate key: %s", err)
	}

	second, err := generateSecretKey()
	if err != nil {
		t.Fatalf("failed to generate key: %s", err)
	}

	if first == second {
		t.Fatal("two generated keys are identical")
	}
	if strings.TrimSpace(first) == "" {
		t.Fatal("generated key is blank")
	}
}

// A failed rotation must leave the working key in place rather than installing
// something guessable.
func TestRegenerateSecretKeyKeepsTheOldKeyWhenGenerationFails(t *testing.T) {
	originalReader := secretKeyReader
	originalRevoke := instance.JWT.RevokeTokensOnLogout
	originalKey := instance.JWT.SecretKey

	t.Cleanup(func() {
		secretKeyReader = originalReader
		instance.JWT.RevokeTokensOnLogout = originalRevoke
		instance.JWT.SecretKey = originalKey
	})

	instance.JWT.RevokeTokensOnLogout = true
	instance.JWT.SecretKey = "the-key-in-use"
	secretKeyReader = failingReader{}

	RegenerateSecretKey()

	if instance.JWT.SecretKey != "the-key-in-use" {
		t.Fatalf("secret key changed to %q after a failed rotation", instance.JWT.SecretKey)
	}
}

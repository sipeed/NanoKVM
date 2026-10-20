package config

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestLoadOrCreateJWTSecretPersistsValue(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".jwt_secret")

	first, err := loadOrCreateJWTSecret(path)
	if err != nil {
		t.Fatalf("create JWT secret: %v", err)
	}
	if first == "" {
		t.Fatal("created an empty JWT secret")
	}

	second, err := loadOrCreateJWTSecret(path)
	if err != nil {
		t.Fatalf("reload JWT secret: %v", err)
	}
	if second != first {
		t.Fatalf("secret changed after reload")
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("stat JWT secret: %v", err)
	}
	if mode := info.Mode().Perm(); runtime.GOOS != "windows" && mode != 0o600 {
		t.Fatalf("JWT secret mode = %o, want 600", mode)
	}
}

func TestLoadOrCreateJWTSecretKeepsConfiguredFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".jwt_secret")
	if err := os.WriteFile(path, []byte("existing-secret\n"), 0o644); err != nil {
		t.Fatalf("seed JWT secret: %v", err)
	}

	secret, err := loadOrCreateJWTSecret(path)
	if err != nil {
		t.Fatalf("load JWT secret: %v", err)
	}
	if secret != "existing-secret" {
		t.Fatalf("secret = %q, want existing-secret", secret)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("stat JWT secret: %v", err)
	}
	if mode := info.Mode().Perm(); runtime.GOOS != "windows" && mode != 0o600 {
		t.Fatalf("JWT secret mode = %o, want 600", mode)
	}
}

func TestLoadOrCreateJWTSecretRepairsEmptyFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".jwt_secret")
	if err := os.WriteFile(path, []byte(" \n"), 0o600); err != nil {
		t.Fatalf("seed empty JWT secret: %v", err)
	}

	secret, err := loadOrCreateJWTSecret(path)
	if err != nil {
		t.Fatalf("repair JWT secret: %v", err)
	}
	if strings.TrimSpace(secret) == "" {
		t.Fatal("replacement JWT secret is empty")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read repaired JWT secret: %v", err)
	}
	if strings.TrimSpace(string(data)) != secret {
		t.Fatal("repaired JWT secret was not persisted")
	}
}

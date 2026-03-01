package netbird

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const (
	NetbirdPath          = "/usr/bin/netbird"
	BundledNetbirdPath   = "/kvmapp/system/netbird/netbird"
	BundledVersionPath   = "/kvmapp/system/netbird/VERSION"
	InstalledVersionPath = "/etc/kvm/netbird.version"
)

func isInstalled() bool {
	_, err := os.Stat(NetbirdPath)
	return err == nil
}

func install() error {
	if _, err := os.Stat(BundledNetbirdPath); err != nil {
		return fmt.Errorf("bundled netbird binary not found: %w", err)
	}

	sourceVersion := getBundledVersion()
	installedVersion := getInstalledVersion()
	if isInstalled() && sourceVersion != "" && sourceVersion == installedVersion {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(NetbirdPath), 0o755); err != nil {
		return fmt.Errorf("create netbird dir failed: %w", err)
	}

	if err := copyFile(BundledNetbirdPath, NetbirdPath); err != nil {
		return err
	}

	if err := os.Chmod(NetbirdPath, 0o755); err != nil {
		return fmt.Errorf("chmod netbird failed: %w", err)
	}

	if sourceVersion != "" {
		if err := os.MkdirAll(filepath.Dir(InstalledVersionPath), 0o755); err != nil {
			return fmt.Errorf("create version dir failed: %w", err)
		}

		if err := os.WriteFile(InstalledVersionPath, []byte(sourceVersion), 0o644); err != nil {
			return fmt.Errorf("write version failed: %w", err)
		}
	}

	return nil
}

func uninstall() error {
	_ = os.Remove(NetbirdPath)
	_ = os.Remove(InstalledVersionPath)
	return nil
}

func getBundledVersion() string {
	return readVersion(BundledVersionPath)
}

func getInstalledVersion() string {
	return readVersion(InstalledVersionPath)
}

func readVersion(path string) string {
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}

	return strings.TrimSpace(string(content))
}

func copyFile(source string, destination string) error {
	src, err := os.Open(source)
	if err != nil {
		return fmt.Errorf("open source failed: %w", err)
	}
	defer func() {
		_ = src.Close()
	}()

	dst, err := os.Create(destination)
	if err != nil {
		return fmt.Errorf("create destination failed: %w", err)
	}
	defer func() {
		_ = dst.Close()
	}()

	if _, err := io.Copy(dst, src); err != nil {
		return fmt.Errorf("copy binary failed: %w", err)
	}

	return nil
}

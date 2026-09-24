// Package vpnpref stores which VPN client is allowed to run on this device.
//
// The device has too little RAM for two VPN clients at once, so exactly one of
// them may be active. The preference is read at boot by S95nanokvm and enforced
// by the HTTP handlers that can start a client.
//
// This package must not import the tailscale or netbird packages: they import it.
package vpnpref

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const (
	File = "/etc/kvm/vpn"

	Tailscale = "tailscale"
	Netbird   = "netbird"
)

// filePath is a variable solely so package tests can exercise the on-disk
// transaction without writing to /etc. Production code must use File.
var filePath = File

// Read returns the preferred VPN, defaulting to tailscale when the file is
// missing or holds anything unexpected.
func Read() string {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return Tailscale
	}

	if strings.TrimSpace(string(data)) == Netbird {
		return Netbird
	}

	return Tailscale
}

// Write records the preferred VPN atomically. Callers must only do this after
// the new client has actually started, so the file never runs ahead of
// reality. A reader therefore observes either the old complete preference or
// the new one, never a truncated/empty file after power loss.
func Write(vpn string) error {
	if !IsValid(vpn) {
		return fmt.Errorf("invalid VPN preference %q", vpn)
	}

	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create VPN preference directory: %w", err)
	}

	tmp, err := os.CreateTemp(dir, ".vpn-")
	if err != nil {
		return fmt.Errorf("create VPN preference temporary file: %w", err)
	}
	tmpName := tmp.Name()
	defer func() { _ = os.Remove(tmpName) }()

	if err := tmp.Chmod(0o644); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("chmod VPN preference temporary file: %w", err)
	}
	if _, err := tmp.WriteString(vpn); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write VPN preference: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("sync VPN preference: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close VPN preference: %w", err)
	}
	if err := os.Rename(tmpName, filePath); err != nil {
		return fmt.Errorf("replace VPN preference: %w", err)
	}

	// Syncing the directory persists the rename on the Linux filesystem used by
	// NanoKVM. It is deliberately best-effort for development hosts/filesystems
	// that do not support directory Sync.
	if directory, err := os.Open(dir); err == nil {
		_ = directory.Sync()
		_ = directory.Close()
	}

	return nil
}

// IsValid reports whether vpn names a VPN this device knows about.
func IsValid(vpn string) bool {
	return vpn == Tailscale || vpn == Netbird
}

// mu serializes every operation that starts or stops a VPN client. Without it
// two concurrent requests interleave stop/start and can leave the device with
// no VPN at all — or, worse, with both running.
var mu sync.Mutex

// TryLock reports whether the caller now owns the VPN state. A caller that gets
// false must fail fast rather than wait: the client times out at 60s and the
// operations behind this lock can take longer.
func TryLock() bool {
	return mu.TryLock()
}

func Unlock() {
	mu.Unlock()
}

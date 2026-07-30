package utils

import (
	"os"
	"strconv"
	"strings"

	log "github.com/sirupsen/logrus"
)

const (
	HDMIDisableFile           = "/etc/kvm/hdmi_disable"
	HDMIIdleTimeoutFile       = "/etc/kvm/hdmi_idle_timeout"
	DefaultHDMIIdleTimeout    = 0
	MaxHDMIIdleTimeoutMinutes = 7 * 24 * 60
)

func PersistHDMIDisabled() {
	f, err := os.OpenFile(HDMIDisableFile, os.O_CREATE|os.O_RDONLY, 0644)
	if err != nil {
		log.Error("failed to create hdmi disable file:", err)
		return
	}
	f.Close()
}

func PersistHDMIEnabled() {
	if err := os.Remove(HDMIDisableFile); err != nil {
		log.Error("failed to remove hdmi disable file:", err)
		return
	}
}

func IsHdmiDisabled() bool {
	if _, err := os.Stat(HDMIDisableFile); err != nil {
		if os.IsNotExist(err) {
			return false // HDMI is enabled
		}
		log.Error("failed to check hdmi disable file:", err)
		return false // Assume HDMI is enabled on error
	}
	return true // HDMI is disabled
}

func PersistHDMIIdleTimeout(minutes int) {
	if err := os.WriteFile(HDMIIdleTimeoutFile, []byte(strconv.Itoa(minutes)), 0644); err != nil {
		log.Error("failed to persist hdmi idle timeout:", err)
	}
}

func GetHDMIIdleTimeout() int {
	data, err := os.ReadFile(HDMIIdleTimeoutFile)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Error("failed to read hdmi idle timeout:", err)
		}
		return DefaultHDMIIdleTimeout
	}

	minutes, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil || minutes < 0 || minutes > MaxHDMIIdleTimeoutMinutes {
		log.Error("invalid hdmi idle timeout")
		return DefaultHDMIIdleTimeout
	}

	return minutes
}

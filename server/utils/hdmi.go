package utils

import (
	"os"

	log "github.com/sirupsen/logrus"
)

const (
	HDMIDisableFile = "/etc/kvm/hdmi_disable"
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

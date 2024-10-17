package config

import (
	"os"
	"strings"

	log "github.com/sirupsen/logrus"
)

type HWVersion int

const (
	HWVersionAlpha HWVersion = iota
	HWVersionBeta
)

const (
	hwVersionFile = "/etc/kvm/hw"

	gpioPower    = "/sys/class/gpio/gpio503/value"
	gpioPowerLED = "/sys/class/gpio/gpio504/value"

	gpioResetAlpha  = "/sys/class/gpio/gpio507/value"
	gpioHDDLedAlpha = "/sys/class/gpio/gpio505/value"

	gpioResetBeta = "/sys/class/gpio/gpio505/value"
)

func (h HWVersion) String() string {
	switch h {
	case HWVersionAlpha:
		return "Alpha"
	case HWVersionBeta:
		return "Beta"
	default:
		return "Unknown"
	}
}

func getHwVersion() HWVersion {
	content, err := os.ReadFile(hwVersionFile)
	if err == nil {
		version := strings.ReplaceAll(string(content), "\n", "")
		if version == "beta" {
			return HWVersionBeta
		}
	}

	return HWVersionAlpha
}

func getHardware() Hardware {
	h := Hardware{}

	h.Version = getHwVersion()
	h.GPIOPower = gpioPower
	h.GPIOPowerLED = gpioPowerLED

	switch h.Version {
	case HWVersionAlpha:
		h.GPIOHDDLed = gpioHDDLedAlpha
		h.GPIOReset = gpioResetAlpha
	case HWVersionBeta:
		h.GPIOReset = gpioResetBeta
	default:
		log.Fatalf("Unsupported hardware version: %s", h.Version)
	}

	return h
}

package virtualdisk

import (
	"os"
	"strings"
)

type Paths struct {
	Config    string
	Marker    string
	Pending   string
	Partition string
}

var (
	mountCommands = []string{
		"sync",
		"umount /data",
		"touch /boot/usb.disk0",
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}

	unmountCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"printf '\\n' > /sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/file",
		"sync",
		"mount /dev/mmcblk0p3 /data",
		"rm /boot/usb.disk0",
		"/etc/init.d/S03usbdev start",
	}
)

func IsConfigured(paths Paths) bool {
	return ConfiguredDisk(paths) != ""
}

func IsDefaultConfigured(paths Paths) bool {
	disk := ConfiguredDisk(paths)
	return disk == paths.Partition
}

func ConfiguredDisk(paths Paths) string {
	content, err := os.ReadFile(paths.Config)
	if err != nil {
		return ""
	}

	disk := strings.TrimSpace(string(content))
	if disk != "" && disk != paths.Partition {
		return disk
	}

	if IsDefaultReady(paths) {
		return paths.Partition
	}
	return ""
}

func IsDefaultReady(paths Paths) bool {
	if _, err := os.Stat(paths.Marker); err != nil {
		return false
	}
	if _, err := os.Stat(paths.Pending); err == nil {
		return false
	}
	_, err := os.Stat(paths.Partition)
	return err == nil
}

func Commands(configured bool, mountCommands, unmountCommands []string) []string {
	if configured {
		return unmountCommands
	}
	return mountCommands
}

func ToggleCommands(configured bool) []string {
	return Commands(configured, mountCommands, unmountCommands)
}

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

func IsConfigured(paths Paths) bool {
	content, err := os.ReadFile(paths.Config)
	if err != nil {
		return false
	}

	disk := strings.TrimSpace(string(content))
	if disk != "" && disk != paths.Partition {
		return true
	}

	if _, err := os.Stat(paths.Marker); err != nil {
		return false
	}
	if _, err := os.Stat(paths.Pending); err == nil {
		return false
	}
	if _, err := os.Stat(paths.Partition); err != nil {
		return false
	}
	return true
}

func Commands(configured bool, mountCommands, unmountCommands []string) []string {
	if configured {
		return unmountCommands
	}
	return mountCommands
}

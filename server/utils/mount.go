package utils

import (
	"os"
	"strings"
)

// IsMountPoint reports whether path is an actual mount point in this process's
// mount namespace. This avoids treating an unmounted mount directory on the
// root filesystem as the data volume.
func IsMountPoint(path string) bool {
	content, err := os.ReadFile("/proc/self/mountinfo")
	return err == nil && IsMountPointInInfo(string(content), path)
}

func IsMountPointInInfo(content, path string) bool {
	for line := range strings.SplitSeq(content, "\n") {
		fields := strings.Fields(line)
		if len(fields) > 4 && fields[4] == path {
			return true
		}
	}
	return false
}

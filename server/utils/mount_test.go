package utils

import "testing"

func TestIsMountPointInInfo(t *testing.T) {
	content := "36 25 179:3 / / rw,relatime - ext4 /dev/mmcblk0p2 rw\n" +
		"37 36 179:4 / /data rw,relatime - exfat /dev/mmcblk0p3 rw\n"

	if !IsMountPointInInfo(content, "/data") {
		t.Fatal("/data mount was not detected")
	}
	if IsMountPointInInfo(content, "/data/child") {
		t.Fatal("child path was incorrectly treated as a mount point")
	}
}

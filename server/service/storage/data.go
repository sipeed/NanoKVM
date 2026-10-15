package storage

import (
	"errors"
	"fmt"
	"os/exec"

	"golang.org/x/sys/unix"
)

// Only one side may write the data partition at a time. The emulated USB disk
// shares that partition with the target machine as a raw, writable disk, and
// while it does the target machine is its only writer, so /data is remounted
// read-only here: remounting keeps every writer on this side away from the
// filesystem, not just the file manager that checks openMedium first.
// Mounting an image read-only hands the partition back to this side, and so
// does releasing the medium.
func SetDataWritable(writable bool) error {
	var stat unix.Statfs_t
	if err := unix.Statfs(mediaDirectory, &stat); err != nil {
		return fmt.Errorf("stat %s: %w", mediaDirectory, err)
	}

	if (stat.Flags&unix.ST_RDONLY == 0) == writable {
		return nil
	}

	option := "rw"
	if !writable {
		option = "ro"
	}

	if err := exec.Command("mount", "-o", "remount,"+option, mediaDirectory).Run(); err != nil {
		return fmt.Errorf("remount %s %s: %w", mediaDirectory, option, err)
	}

	// Never leave a writable /data behind for a target machine that is writing
	// the same filesystem.
	var check unix.Statfs_t
	if err := unix.Statfs(mediaDirectory, &check); err != nil {
		return fmt.Errorf("stat %s: %w", mediaDirectory, err)
	}
	if (check.Flags&unix.ST_RDONLY == 0) != writable {
		return errors.New(mediaDirectory + " mount did not change")
	}

	return nil
}

// DataDiskAttached reports whether the emulated disk serves the whole data
// partition to the target machine, which is the state /data is read-only in.
func DataDiskAttached() bool {
	return IsAttached(partitionDevice)
}

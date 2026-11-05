package storage

import (
	"errors"
	"fmt"
	"os/exec"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"
)

// Only one side may write the data partition at a time. The emulated USB disk
// shares that partition with the target machine as a raw, writable disk, and
// while it does the target machine is its only writer, so /data is remounted
// read-only here: remounting keeps every writer on this side away from the
// filesystem, not just the file manager that checks openMedium first.
// Mounting an image read-only hands the partition back to this side, and so
// does releasing the medium. Every read-only to writable transition drops the
// cache built while the target owned the partition before writers are allowed
// back in; callers must not remount it writable first and clean up afterwards.
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
	} else {
		// The target may have changed both file data and allocation metadata
		// while it owned the block device. Invalidate that view before the
		// filesystem becomes writable, on every path that hands it back.
		// A remount does not recount exFAT's used clusters (counted only at
		// mount), so free space stays stale and freeing what the target wrote
		// can underflow that count until /data is mounted afresh.
		dropAllPartitionCaches()
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

// DataWritable reports whether this side may write the data partition now.
func DataWritable() bool {
	var stat unix.Statfs_t
	if err := unix.Statfs(mediaDirectory, &stat); err != nil {
		return false
	}
	return stat.Flags&unix.ST_RDONLY == 0
}

// healFailureInterval throttles the warning a heal that keeps failing would
// otherwise write: the state is polled every few seconds, and a mount that
// cannot change would fill the log with the same line.
const healFailureInterval = time.Minute

var (
	healFailureMu   sync.Mutex
	healFailureLast time.Time
)

// logHealFailure reports a failed heal, at most once per interval.
func logHealFailure(err error) {
	healFailureMu.Lock()
	defer healFailureMu.Unlock()

	if time.Since(healFailureLast) < healFailureInterval {
		return
	}
	healFailureLast = time.Now()
	logrus.Warnf("heal data partition: %s", err)
}

// healDataPartition puts /data back to read-write when nothing is attached to
// it. Two things leave it read-only with no owner: a release whose remount
// failed, and the kernel itself switching the mount when the exFAT driver hit
// an error (the mount carries errors=remount-ro). In both the target machine
// cannot write the partition any more, so this side taking it back is safe -
// and without it every upload, download and folder would fail with EROFS
// until a reboot.
func healDataPartition() error {
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	status, err := readDiskStatus()
	if err != nil {
		return err
	}
	if status.State == diskStatePartition {
		return nil
	}

	return SetDataWritable(true)
}

// DataDiskAttached reports whether the emulated disk serves the whole data
// partition to the target machine, which is the state /data is read-only in.
func DataDiskAttached() bool {
	return IsAttached(partitionDevice)
}

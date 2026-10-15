package utils

import (
	"fmt"
	"math"

	"golang.org/x/sys/unix"
)

// Statfs reports the total and available bytes of the filesystem holding path.
// It applies no reserve policy on purpose: each caller decides what it has to
// keep back, so the numbers stay plain.
func Statfs(path string) (total, available uint64, err error) {
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return 0, 0, fmt.Errorf("stat filesystem %s: %w", path, err)
	}

	blockSize := uint64(stat.Bsize)
	if blockSize != 0 && (stat.Blocks > math.MaxUint64/blockSize || stat.Bavail > math.MaxUint64/blockSize) {
		return 0, 0, fmt.Errorf("filesystem size overflow on %s", path)
	}

	return stat.Blocks * blockSize, stat.Bavail * blockSize, nil
}

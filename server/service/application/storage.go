package application

import (
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"

	"golang.org/x/sys/unix"
)

var ErrInsufficientStorage = errors.New("insufficient storage")

type filesystemSpace struct {
	total     uint64
	available uint64
}

func getFilesystemSpace(path string) (filesystemSpace, error) {
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return filesystemSpace{}, fmt.Errorf("stat filesystem %s: %w", path, err)
	}
	return filesystemSpaceFromStats(uint64(stat.Blocks), uint64(stat.Bavail), uint64(stat.Bsize))
}

func filesystemSpaceFromStats(blocks, availableBlocks, blockSize uint64) (filesystemSpace, error) {
	if blockSize != 0 && (blocks > math.MaxUint64/blockSize || availableBlocks > math.MaxUint64/blockSize) {
		return filesystemSpace{}, fmt.Errorf("filesystem size overflow")
	}
	return filesystemSpace{total: blocks * blockSize, available: availableBlocks * blockSize}, nil
}

func reserveBytes(total uint64) uint64 {
	percent := total / 100 * freeReservePercent
	percent += total % 100 * freeReservePercent / 100
	if percent > minFreeReserve {
		return percent
	}
	return minFreeReserve
}

func hasFreeSpace(space filesystemSpace, payload uint64) (bool, uint64, error) {
	reserve := reserveBytes(space.total)
	if payload > math.MaxUint64-reserve {
		return false, 0, fmt.Errorf("storage requirement overflow")
	}
	required := payload + reserve
	return space.available >= required, required, nil
}

func ensureFreeSpace(path string, payloadBytes uint64) error {
	space, err := getFilesystemSpace(path)
	if err != nil {
		return err
	}
	ok, required, err := hasFreeSpace(space, payloadBytes)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("%w: need %d MiB including reserve, %d MiB available on %s", ErrInsufficientStorage, required>>20, space.available>>20, path)
	}
	return nil
}

func ensureExpandedSpace(path string, expandedBytes uint64) error {
	err := ensureFreeSpace(path, expandedBytes)
	if !errors.Is(err, ErrInsufficientStorage) {
		return err
	}
	info, statErr := os.Stat(BackupDir)
	if statErr != nil {
		if os.IsNotExist(statErr) {
			return err
		}
		return fmt.Errorf("stat application backup: %w", statErr)
	}
	if !info.IsDir() {
		return fmt.Errorf("application backup is not a directory")
	}
	if removeErr := os.RemoveAll(BackupDir); removeErr != nil {
		return fmt.Errorf("remove application backup: %w", removeErr)
	}
	return ensureFreeSpace(path, expandedBytes)
}

func ensureInstallFilesystem(workspaceDir, appDir, backupDir string) error {
	paths := []string{workspaceDir, filepath.Dir(appDir), filepath.Dir(backupDir)}
	var device uint64
	for i, path := range paths {
		var stat unix.Stat_t
		if err := unix.Stat(path, &stat); err != nil {
			return fmt.Errorf("stat install filesystem %s: %w", path, err)
		}
		if i == 0 {
			device = uint64(stat.Dev)
			continue
		}
		if uint64(stat.Dev) != device {
			return fmt.Errorf("update workspace, application and backup must be on the same filesystem")
		}
	}
	return nil
}

package application

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type updateWorkspace struct {
	dir string
}

func newUpdateWorkspace(baseDir string) (*updateWorkspace, error) {
	if err := os.MkdirAll(baseDir, cacheDirMode); err != nil {
		return nil, fmt.Errorf("create update cache: %w", err)
	}
	if err := os.Chmod(baseDir, cacheDirMode); err != nil {
		return nil, fmt.Errorf("chmod update cache: %w", err)
	}
	dir, err := os.MkdirTemp(baseDir, updateWorkspacePrefix)
	if err != nil {
		return nil, fmt.Errorf("create update workspace: %w", err)
	}
	return &updateWorkspace{dir: dir}, nil
}

func (w *updateWorkspace) Close() error {
	return os.RemoveAll(w.dir)
}

func cleanupStaleWorkspaces(baseDir string) error {
	entries, err := os.ReadDir(baseDir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), updateWorkspacePrefix) {
			continue
		}
		if err := os.RemoveAll(filepath.Join(baseDir, entry.Name())); err != nil {
			return err
		}
	}
	return nil
}

func prepareCacheForUpdate() error {
	info, err := os.Stat(AppDir)
	if err != nil {
		return fmt.Errorf("stat current application: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("current application is not a directory")
	}
	if err := os.MkdirAll(CacheDir, cacheDirMode); err != nil {
		return fmt.Errorf("create update cache: %w", err)
	}
	if err := os.Chmod(CacheDir, cacheDirMode); err != nil {
		return fmt.Errorf("chmod update cache: %w", err)
	}
	if err := cleanupStaleWorkspaces(CacheDir); err != nil {
		return fmt.Errorf("clean stale update workspace: %w", err)
	}
	return nil
}

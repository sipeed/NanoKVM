package utils

import (
	"os"
	"path/filepath"
)

func ChmodRecursively(path string, mode uint32) error {
	return filepath.Walk(path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			err = os.Chmod(path, os.FileMode(mode))
			if err != nil {
				return err
			}
		}

		return nil
	})
}

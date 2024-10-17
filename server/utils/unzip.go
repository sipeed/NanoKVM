package utils

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
)

func Unzip(filename string, dest string) error {
	r, err := zip.OpenReader(filename)
	if err != nil {
		return err
	}
	defer func() {
		_ = r.Close()
	}()

	for _, f := range r.File {
		dstPath := filepath.Join(dest, filepath.Clean("/"+f.Name))
		if f.FileInfo().IsDir() {
			err = os.MkdirAll(dstPath, 0o755)
			if err != nil {
				return err
			}
		} else {
			err = unzipFile(dstPath, f)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func unzipFile(dstPath string, f *zip.File) error {
	err := os.MkdirAll(filepath.Dir(dstPath), 0o755)
	if err != nil {
		return err
	}
	out, err := os.OpenFile(dstPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
	if err != nil {
		return err
	}
	defer func() {
		_ = out.Close()
	}()

	archivedFile, err := f.Open()
	if err != nil {
		return err
	}

	if _, err = io.Copy(out, archivedFile); err != nil {
		return err
	}
	if err = os.Chmod(dstPath, f.Mode()); err != nil {
		return err
	}
	return nil
}

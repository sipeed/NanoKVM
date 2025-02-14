package utils

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func UnTarGz(srcFile string, destDir string) (string, error) {
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return "", err
	}

	fr, err := os.Open(srcFile)
	if err != nil {
		return "", err
	}
	defer func() {
		_ = fr.Close()
	}()

	gr, err := gzip.NewReader(fr)
	if err != nil {
		return "", err
	}
	defer func() {
		_ = gr.Close()
	}()

	tr := tar.NewReader(gr)

	targetFile := ""
	for {
		header, err := tr.Next()

		if err == io.EOF {
			break
		}

		if err != nil {
			return "", err
		}

		if targetFile == "" {
			parts := strings.Split(header.Name, "/")
			if len(parts) > 0 {
				targetFile = filepath.Join(destDir, parts[0])
			}
		}

		filename := filepath.Join(destDir, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(filename, os.FileMode(header.Mode)); err != nil {
				return "", err
			}

		case tar.TypeReg:
			file, err := os.OpenFile(filename, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return "", err
			}

			if _, err := io.Copy(file, tr); err != nil {
				_ = file.Close()
				return "", err
			}
			_ = file.Close()

		case tar.TypeSymlink:
			if err := os.Symlink(header.Linkname, filename); err != nil {
				return "", err
			}
		}
	}

	return targetFile, nil
}

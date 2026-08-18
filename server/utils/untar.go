package utils

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// ErrUnsafeArchiveEntry is returned when an archive entry would write outside
// the destination directory, or is a link that could be used to do so later.
var ErrUnsafeArchiveEntry = errors.New("unsafe archive entry")

func UnTarGz(srcFile string, destDir string) (string, error) {
	// The containment check below compares absolute paths, so resolve the
	// destination once here rather than depending on the caller for it.
	destDir, err := filepath.Abs(destDir)
	if err != nil {
		return "", err
	}

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

		// An absolute name would silently lose its leading separator on join,
		// so refuse it rather than relocating it.
		if filepath.IsAbs(header.Name) || strings.HasPrefix(header.Name, "/") {
			return "", ErrUnsafeArchiveEntry
		}

		filename := filepath.Join(destDir, header.Name)
		if !IsPathInside(destDir, filename) {
			return "", ErrUnsafeArchiveEntry
		}

		switch header.Typeflag {
		case tar.TypeDir:
			// Keep the owner's write and search bits, otherwise an archive
			// declaring a read-only directory blocks its own extraction.
			if err := os.MkdirAll(filename, os.FileMode(header.Mode)|0o700); err != nil {
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

		case tar.TypeSymlink, tar.TypeLink:
			// A link entry can point anywhere, and later entries would then
			// write through it as root. Update packages do not need links.
			return "", ErrUnsafeArchiveEntry
		}
	}

	return targetFile, nil
}

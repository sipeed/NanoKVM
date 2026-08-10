package application

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path"
	"path/filepath"
	"strings"
)

type updateArchiveInfo struct {
	root          string
	expandedBytes uint64
	entries       int
}

func inspectUpdateArchive(archivePath, expectedRoot string) (updateArchiveInfo, error) {
	file, err := os.Open(archivePath)
	if err != nil {
		return updateArchiveInfo{}, err
	}
	defer file.Close()
	reader, err := gzip.NewReader(file)
	if err != nil {
		return updateArchiveInfo{}, fmt.Errorf("open gzip archive: %w", err)
	}
	defer reader.Close()

	info := updateArchiveInfo{root: expectedRoot}
	seen := make(map[string]struct{})
	hasRoot, hasVersion := false, false
	tarReader := tar.NewReader(reader)
	for {
		header, err := tarReader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return updateArchiveInfo{}, fmt.Errorf("read tar archive: %w", err)
		}
		name, err := validateArchiveHeader(header, expectedRoot)
		if err != nil {
			return updateArchiveInfo{}, err
		}
		if _, ok := seen[name]; ok {
			return updateArchiveInfo{}, fmt.Errorf("duplicate archive entry %q", name)
		}
		seen[name] = struct{}{}
		info.entries++
		if info.entries > maxArchiveEntries {
			return updateArchiveInfo{}, fmt.Errorf("update archive has more than %d entries", maxArchiveEntries)
		}
		if name == expectedRoot && header.Typeflag == tar.TypeDir {
			hasRoot = true
		}
		if name == expectedRoot+"/version" && isRegularType(header.Typeflag) {
			hasVersion = true
		}
		if isRegularType(header.Typeflag) {
			if header.Size < 0 {
				return updateArchiveInfo{}, fmt.Errorf("negative archive file size")
			}
			size := uint64(header.Size)
			if size > maxExpandedSize-info.expandedBytes {
				return updateArchiveInfo{}, fmt.Errorf("update archive expanded size exceeds %d bytes", maxExpandedSize)
			}
			if info.expandedBytes > math.MaxUint64-size {
				return updateArchiveInfo{}, fmt.Errorf("update archive expanded size overflow")
			}
			info.expandedBytes += size
		}
	}
	if !hasRoot {
		return updateArchiveInfo{}, fmt.Errorf("invalid update package layout: missing top-level directory")
	}
	if !hasVersion {
		return updateArchiveInfo{}, fmt.Errorf("invalid update package layout: missing version file")
	}
	return info, nil
}

func extractUpdateArchive(archivePath, destDir, expectedRoot string) (string, error) {
	file, err := os.Open(archivePath)
	if err != nil {
		return "", err
	}
	defer file.Close()
	reader, err := gzip.NewReader(file)
	if err != nil {
		return "", fmt.Errorf("open gzip archive: %w", err)
	}
	defer reader.Close()

	seen := make(map[string]struct{})
	entries := 0
	expanded := uint64(0)
	tarReader := tar.NewReader(reader)
	for {
		header, err := tarReader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return "", fmt.Errorf("read tar archive: %w", err)
		}
		name, err := validateArchiveHeader(header, expectedRoot)
		if err != nil {
			return "", err
		}
		if _, ok := seen[name]; ok {
			return "", fmt.Errorf("duplicate archive entry %q", name)
		}
		seen[name] = struct{}{}
		entries++
		if entries > maxArchiveEntries {
			return "", fmt.Errorf("update archive has more than %d entries", maxArchiveEntries)
		}

		filename := filepath.Join(destDir, filepath.FromSlash(name))
		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(filename, 0o755); err != nil {
				return "", fmt.Errorf("create archive directory: %w", err)
			}
		case tar.TypeReg, tar.TypeRegA:
			if header.Size < 0 {
				return "", fmt.Errorf("negative archive file size")
			}
			size := uint64(header.Size)
			if size > maxExpandedSize-expanded {
				return "", fmt.Errorf("update archive expanded size exceeds %d bytes", maxExpandedSize)
			}
			expanded += size
			if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
				return "", fmt.Errorf("create archive parent directory: %w", err)
			}
			out, err := os.OpenFile(filename, os.O_WRONLY|os.O_CREATE|os.O_EXCL, os.FileMode(header.Mode)&0o777)
			if err != nil {
				return "", fmt.Errorf("create archive file: %w", err)
			}
			written, copyErr := io.CopyN(out, tarReader, header.Size)
			closeErr := out.Close()
			if copyErr != nil {
				return "", fmt.Errorf("write archive file: %w", copyErr)
			}
			if written != header.Size {
				return "", fmt.Errorf("truncated archive file %q", name)
			}
			if closeErr != nil {
				return "", fmt.Errorf("close archive file: %w", closeErr)
			}
		}
	}
	return filepath.Join(destDir, expectedRoot), nil
}

func validateArchiveHeader(header *tar.Header, expectedRoot string) (string, error) {
	if header.Name == "" || path.IsAbs(header.Name) {
		return "", fmt.Errorf("invalid archive path %q", header.Name)
	}
	name := path.Clean(header.Name)
	if name == "." || name == ".." || strings.HasPrefix(name, "../") {
		return "", fmt.Errorf("invalid archive path %q", header.Name)
	}
	if name != expectedRoot && !strings.HasPrefix(name, expectedRoot+"/") {
		return "", fmt.Errorf("invalid update package layout: entry %q is outside %s", header.Name, expectedRoot)
	}
	if !isRegularType(header.Typeflag) && header.Typeflag != tar.TypeDir {
		return "", fmt.Errorf("unsupported archive entry type for %q", header.Name)
	}
	return name, nil
}

func isRegularType(typeFlag byte) bool {
	return typeFlag == tar.TypeReg || typeFlag == tar.TypeRegA
}

func validateExtractedPackage(rootDir, expectedVersion string) error {
	version, err := os.ReadFile(filepath.Join(rootDir, "version"))
	if err != nil {
		return fmt.Errorf("invalid update package layout: read version: %w", err)
	}
	if strings.TrimSpace(string(version)) != expectedVersion {
		return fmt.Errorf("invalid update package layout: version mismatch")
	}
	for _, required := range []string{
		"version",
		"server/NanoKVM-Server",
		"kvm_system/kvm_system",
		"system/init.d/S95nanokvm",
	} {
		info, err := os.Stat(filepath.Join(rootDir, filepath.FromSlash(required)))
		if err != nil || !info.Mode().IsRegular() {
			return fmt.Errorf("invalid update package layout: missing required file %s", required)
		}
	}
	return nil
}

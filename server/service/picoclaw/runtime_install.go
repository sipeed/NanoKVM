package picoclaw

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	log "github.com/sirupsen/logrus"
)

func (s *Service) installRuntime() (string, *PicoclawError) {
	log.Debugf("picoclaw install: start, binary=%s, cache=%s", picoclawBinaryPath, picoclawCacheDir)

	currentStatus := s.runtime.Get()
	if currentStatus.Installing {
		log.Debugf("picoclaw install: install already in progress")
		return "picoclaw installation is already in progress", nil
	}

	if installed, err := isPicoclawInstalled(); err == nil && installed {
		settings, _ := loadPicoclawGatewaySettings()
		log.Debugf("picoclaw install: binary already exists at %s", picoclawBinaryPath)
		s.runtime.Set(RuntimeStatus{
			Ready:           false,
			Installed:       true,
			Installing:      false,
			InstallProgress: 100,
			InstallStage:    "installed",
			InstallPath:     picoclawBinaryPath,
			ModelConfigured: settings.ModelConfigured,
			ModelName:       settings.ModelName,
			Status:          "installed",
			CheckedAt:       time.Now(),
		})
		return "picoclaw is already installed", nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), picoclawInstallTimeout)
	s.runtime.Set(RuntimeStatus{
		Ready:           false,
		Installed:       false,
		Installing:      true,
		InstallProgress: 0,
		InstallStage:    "preparing",
		InstallPath:     picoclawBinaryPath,
		Status:          "installing",
		CheckedAt:       time.Now(),
	})

	go s.runInstallRuntime(ctx, cancel)
	return "picoclaw installation started", nil
}

func (s *Service) runInstallRuntime(ctx context.Context, cancel context.CancelFunc) {
	defer cancel()

	_ = os.RemoveAll(picoclawCacheDir)
	if err := os.MkdirAll(picoclawCacheDir, 0o755); err != nil {
		log.Errorf("picoclaw install: failed to create cache directory %s: %v", picoclawCacheDir, err)
		s.finishInstallFailure("install_failed", fmt.Sprintf("failed to create cache directory: %v", err))
		return
	}
	log.Debugf("picoclaw install: cache directory ready at %s", picoclawCacheDir)
	defer func() {
		if err := os.RemoveAll(picoclawCacheDir); err != nil {
			log.Errorf("picoclaw install: failed to clean cache directory %s: %v", picoclawCacheDir, err)
			return
		}
		log.Debugf("picoclaw install: cleaned cache directory %s", picoclawCacheDir)
	}()

	s.setInstallProgress("downloading", 5, "")
	archivePath := filepath.Join(picoclawCacheDir, "picoclaw.tar.gz")
	log.Debugf("picoclaw install: downloading archive from %s to %s", picoclawDownloadURL, archivePath)
	if err := downloadPicoclawArchive(ctx, archivePath, func(downloaded int64, total int64) {
		progress := 10
		if total > 0 {
			progress = 10 + int(float64(downloaded)*70/float64(total))
			if progress > 80 {
				progress = 80
			}
		}
		s.setInstallProgress("downloading", progress, "")
	}); err != nil {
		log.Errorf("picoclaw install: download failed: %v", err)
		s.finishInstallFailure(installFailureStatus(err), err.Error())
		return
	}
	log.Debugf("picoclaw install: archive download completed")

	s.setInstallProgress("extracting", 85, "")
	log.Debugf("picoclaw install: extracting binary from %s", archivePath)
	extractedPath, err := extractPicoclawBinary(archivePath, picoclawCacheDir)
	if err != nil {
		log.Errorf("picoclaw install: extract failed: %v", err)
		s.finishInstallFailure(installFailureStatus(err), err.Error())
		return
	}
	log.Debugf("picoclaw install: extracted binary to %s", extractedPath)

	s.setInstallProgress("installing", 95, "")
	log.Debugf("picoclaw install: installing binary to %s", picoclawBinaryPath)
	if err := installPicoclawBinary(extractedPath, picoclawBinaryPath); err != nil {
		log.Errorf("picoclaw install: install failed: %v", err)
		s.finishInstallFailure(installFailureStatus(err), err.Error())
		return
	}
	log.Debugf("picoclaw install: install completed successfully")

	s.runtime.Set(RuntimeStatus{
		Ready:           false,
		Installed:       true,
		Installing:      false,
		InstallProgress: 100,
		InstallStage:    "installed",
		InstallPath:     picoclawBinaryPath,
		Status:          "installed",
		CheckedAt:       time.Now(),
	})
}

func downloadPicoclawArchive(ctx context.Context, destination string, onProgress func(downloaded int64, total int64)) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, picoclawDownloadURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create download request: %w", err)
	}

	client := &http.Client{
		Timeout: picoclawDownloadTimeout,
	}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to download picoclaw: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download picoclaw: unexpected status %s", resp.Status)
	}

	file, err := os.Create(destination)
	if err != nil {
		return fmt.Errorf("failed to create archive file: %w", err)
	}
	defer file.Close()

	if err := copyWithProgress(ctx, file, resp.Body, resp.ContentLength, onProgress); err != nil {
		return fmt.Errorf("failed to save archive: %w", err)
	}
	return nil
}

func copyWithProgress(ctx context.Context, dst io.Writer, src io.Reader, total int64, onProgress func(downloaded int64, total int64)) error {
	buffer := make([]byte, 32*1024)
	var downloaded int64

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, readErr := src.Read(buffer)
		if n > 0 {
			if _, writeErr := dst.Write(buffer[:n]); writeErr != nil {
				return writeErr
			}
			downloaded += int64(n)
			if onProgress != nil {
				onProgress(downloaded, total)
			}
		}
		if readErr == io.EOF {
			if onProgress != nil {
				onProgress(downloaded, total)
			}
			return nil
		}
		if readErr != nil {
			return readErr
		}
	}
}

func (s *Service) setInstallProgress(stage string, progress int, lastError string) {
	if progress < 0 {
		progress = 0
	}
	if progress > 100 {
		progress = 100
	}

	s.runtime.UpdateInstallStatus(func(status *RuntimeStatus) {
		status.Ready = false
		status.Installed = false
		status.Installing = true
		status.InstallProgress = progress
		status.InstallStage = stage
		status.Status = "installing"
		status.LastError = lastError
		status.CheckedAt = time.Now()
	})
}

func (s *Service) finishInstallFailure(status string, message string) {
	s.runtime.Set(RuntimeStatus{
		Ready:           false,
		Installed:       false,
		Installing:      false,
		InstallProgress: 0,
		InstallStage:    status,
		InstallPath:     picoclawBinaryPath,
		Status:          status,
		LastError:       message,
		CheckedAt:       time.Now(),
	})
}

func installFailureStatus(err error) string {
	if err == nil {
		return "install_failed"
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return "install_timeout"
	}
	return "install_failed"
}

func extractPicoclawBinary(archivePath string, destinationDir string) (string, error) {
	file, err := os.Open(archivePath)
	if err != nil {
		return "", fmt.Errorf("failed to open archive: %w", err)
	}
	defer file.Close()

	gzipReader, err := gzip.NewReader(file)
	if err != nil {
		return "", fmt.Errorf("failed to read archive: %w", err)
	}
	defer gzipReader.Close()

	tarReader := tar.NewReader(gzipReader)
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to extract archive: %w", err)
		}
		if header.Typeflag != tar.TypeReg {
			continue
		}
		if filepath.Base(header.Name) != "picoclaw" {
			continue
		}

		extractedPath := filepath.Join(destinationDir, "picoclaw")
		outFile, err := os.OpenFile(extractedPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
		if err != nil {
			return "", fmt.Errorf("failed to create extracted binary: %w", err)
		}
		if _, err := io.Copy(outFile, tarReader); err != nil {
			_ = outFile.Close()
			return "", fmt.Errorf("failed to extract picoclaw binary: %w", err)
		}
		if err := outFile.Close(); err != nil {
			return "", fmt.Errorf("failed to finalize extracted binary: %w", err)
		}
		return extractedPath, nil
	}

	return "", fmt.Errorf("picoclaw binary not found in archive")
}

func installPicoclawBinary(source string, destination string) error {
	inFile, err := os.Open(source)
	if err != nil {
		return fmt.Errorf("failed to open extracted picoclaw binary: %w", err)
	}
	defer inFile.Close()

	tempDestination := destination + ".tmp"
	outFile, err := os.OpenFile(tempDestination, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return fmt.Errorf("failed to create destination binary: %w", err)
	}

	if _, err := io.Copy(outFile, inFile); err != nil {
		_ = outFile.Close()
		_ = os.Remove(tempDestination)
		return fmt.Errorf("failed to write destination binary: %w", err)
	}
	if err := outFile.Close(); err != nil {
		_ = os.Remove(tempDestination)
		return fmt.Errorf("failed to finalize destination binary: %w", err)
	}
	if err := os.Chmod(tempDestination, 0o755); err != nil {
		_ = os.Remove(tempDestination)
		return fmt.Errorf("failed to set destination mode: %w", err)
	}
	if err := os.Rename(tempDestination, destination); err != nil {
		_ = os.Remove(tempDestination)
		return fmt.Errorf("failed to install picoclaw binary: %w", err)
	}
	return nil
}

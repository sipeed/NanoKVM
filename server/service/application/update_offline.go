package application

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"NanoKVM-Server/proto"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var validFilenameRegex = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

func (s *Service) OfflineUpdate(c *gin.Context) {
	var rsp proto.Response

	if !acquireUpdateLock() {
		rsp.ErrRsp(c, -1, "update already in progress")
		return
	}
	defer releaseUpdateLock()

	if err := offlineUpdate(c); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("update failed: %s", err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("offline update application success")

	go restartServices()
}

func offlineUpdate(c *gin.Context) error {
	expectedSHA256, err := parseSHA256Checksum(c.GetHeader("X-SHA256-Checksum"))
	if err != nil {
		return err
	}

	_ = os.RemoveAll(CacheDir)
	_ = os.MkdirAll(CacheDir, 0o755)
	defer func() {
		_ = os.RemoveAll(CacheDir)
	}()

	if err := createSentinelFile(); err != nil {
		return err
	}
	defer removeSentinelFile()

	reader, err := c.Request.MultipartReader()
	if err != nil {
		log.Errorf("Invalid multipart data: %v", err)
		return fmt.Errorf("invalid multipart data: %w", err)
	}

	target, err := processUpload(reader, c.Request.ContentLength)
	if err != nil {
		log.Errorf("failed to upload install package: %v", err)
		return err
	}

	if err := verifySHA256Checksum(target, expectedSHA256); err != nil {
		log.Errorf("failed to verify install package: %v", err)
		return err
	}

	if err := installPackage(target); err != nil {
		log.Errorf("failed to install package: %v", err)
		return err
	}

	return nil
}

func parseSHA256Checksum(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}

	checksum, err := hex.DecodeString(value)
	if err != nil || len(checksum) != sha256.Size {
		return nil, fmt.Errorf("invalid sha256 checksum")
	}

	return checksum, nil
}

func verifySHA256Checksum(filePath string, expected []byte) error {
	if len(expected) == 0 {
		return nil
	}

	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return fmt.Errorf("failed to calculate sha256 checksum: %w", err)
	}

	if subtle.ConstantTimeCompare(hasher.Sum(nil), expected) != 1 {
		return fmt.Errorf("sha256 checksum mismatch")
	}

	return nil
}

func createSentinelFile() error {
	file, err := os.OpenFile(
		sentinelPath,
		os.O_WRONLY|os.O_CREATE|os.O_EXCL,
		sentinelPermission,
	)
	if err != nil {
		if os.IsExist(err) {
			return fmt.Errorf("download already in progress")
		}
		log.Errorf("Failed to create sentinel file: %v", err)
		return fmt.Errorf("failed to create sentinel file: %w", err)
	}

	if _, err := file.WriteString("downloading"); err != nil {
		_ = file.Close()
		_ = os.Remove(sentinelPath)
		return fmt.Errorf("failed to initialize sentinel file: %w", err)
	}
	if err := file.Close(); err != nil {
		_ = os.Remove(sentinelPath)
		return fmt.Errorf("failed to close sentinel file: %w", err)
	}

	return nil
}

func processUpload(reader *multipart.Reader, contentLength int64) (string, error) {
	var outPath string

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to read multipart: %w", err)
		}

		if part.FormName() != "file" {
			continue
		}

		outPath, err = saveUploadedFile(part, contentLength)
		if err != nil {
			return "", err
		}
	}

	if outPath == "" {
		return "", fmt.Errorf("no file uploaded")
	}

	return outPath, nil
}

func saveUploadedFile(part *multipart.Part, contentLength int64) (string, error) {
	filename := part.FileName()
	if filename == "" {
		return "", fmt.Errorf("no filename provided")
	}

	if err := validateFilename(filename); err != nil {
		return "", err
	}

	outPath := filepath.Join(CacheDir, filename)
	out, err := os.Create(outPath)
	if err != nil {
		return "", fmt.Errorf("failed to create output file: %w", err)
	}
	defer out.Close()

	pw := newProgressWriter(out, contentLength)
	defer pw.Stop()

	if _, err := io.Copy(pw, part); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return outPath, nil
}

func validateFilename(filename string) error {
	baseName := filepath.Base(filename)

	// Check if the path contains directory components
	if baseName != filename {
		log.Warnf("Path detected in filename: %s", filename)
		return fmt.Errorf("path detected in filename")
	}

	// Check for path traversal attempts
	if strings.Contains(filename, "..") {
		log.Warnf("Path traversal attempt: %s", filename)
		return fmt.Errorf("invalid filename: path traversal detected")
	}

	// Validate filename characters
	if !validFilenameRegex.MatchString(filename) {
		log.Warnf("Invalid filename characters: %s", filename)
		return fmt.Errorf("invalid filename: contains invalid characters")
	}

	return nil
}

func removeSentinelFile() {
	_ = os.Remove(sentinelPath)
}

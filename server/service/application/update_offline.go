package application

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

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

	time.Sleep(1 * time.Second)
	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func offlineUpdate(c *gin.Context) error {
	_ = os.RemoveAll(CacheDir)
	_ = os.MkdirAll(CacheDir, 0o755)
	defer func() {
		_ = os.RemoveAll(CacheDir)
	}()

	if err := checkDownloadInProgress(); err != nil {
		return err
	}

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

	if err := installPackage(target); err != nil {
		log.Errorf("failed to install package: %v", err)
		return err
	}

	return nil
}

func checkDownloadInProgress() error {
	if utils.ProgressStatusExists() {
		log.Debug("Download in progress")
		return fmt.Errorf("download already in progress")
	}
	return nil
}

func createSentinelFile() error {
	if err := utils.WriteProgressStatus("downloading"); err != nil {
		log.Errorf("Failed to create sentinel file: %v", err)
		return fmt.Errorf("failed to create sentinel file: %w", err)
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

	if err := utils.ValidateFlatFilename(filename); err != nil {
		return "", err
	}

	outPath := filepath.Join(CacheDir, filename)
	out, err := os.Create(outPath)
	if err != nil {
		return "", fmt.Errorf("failed to create output file: %w", err)
	}
	defer out.Close()

	pw := utils.NewProgressWriter(out, contentLength, utils.ProgressStatusPath)
	defer pw.Stop()

	if _, err := io.Copy(pw, part); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return outPath, nil
}

func removeSentinelFile() {
	utils.ClearProgressStatus()
}

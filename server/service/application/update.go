package application

import (
	"crypto/sha512"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"sync"
	"time"
	"path/filepath"
	"strings"
	"regexp"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
)

var sentinelPath = "/tmp/.download_in_progress"

const (
	maxTries = 3
)

var (
	updateMutex sync.Mutex
	isUpdating  bool
)

func (s *Service) UploadUpdate(c *gin.Context) {
	var rsp proto.Response

	updateMutex.Lock()
	if isUpdating {
		updateMutex.Unlock()
		rsp.ErrRsp(c, -1, "update already in progress")
		return
	}
	isUpdating = true
	updateMutex.Unlock()

	defer func() {
		updateMutex.Lock()
		isUpdating = false
		updateMutex.Unlock()
	}()

	if err := uploadupdate(rsp, c); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("update failed: %s", err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update application success")

	// Sleep for a second before restarting the device
	time.Sleep(1 * time.Second)

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func uploadupdate(rsp proto.Response, c *gin.Context) error {
	_ = os.RemoveAll(CacheDir)
	_ = os.MkdirAll(CacheDir, 0o755)
	defer func() {
		_ = os.RemoveAll(CacheDir)
	}()

	// Set a sentinel file to mark that there is a download in progress
	// This is to prevent multiple downloads at the same time
	if _, err := os.Stat(sentinelPath); err == nil {
		log.Debug("Download in progress")
		rsp.ErrRsp(c, -1, "download in progress")
		return err
	}

	// Create the sentinel file
	err := os.WriteFile(sentinelPath, []byte("start"), 0644)
	if err != nil {
		log.Error("Failed to create sentinel file")
		rsp.ErrRsp(c, -1, "failed to create sentinel file")
		return err
	}

    // Multipart Reader direkt nutzen (keine FormFile!)
    reader, err := c.Request.MultipartReader()
    if err != nil {
		log.Error("invalid multipart data")
		rsp.ErrRsp(c, -1, "invalid multipart data")
		defer os.Remove(sentinelPath)
        return err
    }

	
	var lw *loggingWriter
	var outPath = ""

    for {
        part, err := reader.NextPart()
        if err == io.EOF {
            break
        }
        if err != nil {
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return err
        }

        if part.FormName() != "file" {
            continue
        }

        filename := part.FileName()
        if filename == "" {
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return fmt.Errorf("no filename")
        }

		filename = filepath.Base(filename)

		if filename != part.FileName() {
			defer os.Remove(sentinelPath)
			return fmt.Errorf("path detected in filename")
		}

		if strings.Contains(filename, "..") {
			log.Warn("path traversal attempt")
			rsp.ErrRsp(c, -1, "invalid filename")
			defer os.Remove(sentinelPath)
			return fmt.Errorf("path traversal attempt")
		}

		valid := regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
		if !valid.MatchString(filename) {
			rsp.ErrRsp(c, -1, "invalid filename")
			defer os.Remove(sentinelPath)
			return fmt.Errorf("err4")
		}

		data, err := os.ReadFile(sentinelPath)
		if err != nil {
			lw.stopTicker()
			defer os.Remove(sentinelPath)
			return err
		}

        outPath = "/data/" + filename
        out, err := os.Create(outPath)
        if err != nil {
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return err
        }
        defer out.Close()

		if strings.Contains(string(data), "start") {
			err = os.WriteFile(sentinelPath, []byte(filename), 0644)
			if err != nil {
				lw.stopTicker()
				defer os.Remove(outPath)
				defer os.Remove(sentinelPath)
				return err
			}
			
			lw = &loggingWriter{writer: out, totalSize: c.Request.ContentLength}
			lw.startTicker()
		} else {
			if !strings.Contains(string(data), filename) {
				lw.stopTicker()
				defer os.Remove(outPath)
				defer os.Remove(sentinelPath)
				return fmt.Errorf("failed")
			}
		}

        // Direkt streamen → kein RAM-Bedarf außer kleinem Buffer
        _, err = io.Copy(lw, part)
        if err != nil {
			lw.stopTicker()
			defer os.Remove(outPath)
			defer os.Remove(sentinelPath)
            return err
        }
    }
	lw.stopTicker()

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "idle",
		File:       "",
		Percentage: "",
	})
	
	defer os.Remove(sentinelPath)

	// decompress
	dir, err := utils.UnTarGz(outPath, CacheDir)
	if err != nil {
		fmt.Errorf("decompress app failed: %s", err)
		return err
	}

	// backup old version
	if err := os.RemoveAll(BackupDir); err != nil {
		fmt.Errorf("remove backup failed: %s", err)
		return err
	}

	if err := utils.MoveFilesRecursively(AppDir, BackupDir); err != nil {
		fmt.Errorf("backup app failed: %s", err)
		return err
	}

	// update
	if err := utils.MoveFilesRecursively(dir, AppDir); err != nil {
		fmt.Errorf("failed to move update back in place: %s", err)
		return err
	}

	// modify permissions
	if err := utils.ChmodRecursively(AppDir, 0o755); err != nil {
		fmt.Errorf("chmod failed: %s", err)
		return err
	}

	return nil
}

func (s *Service) Update(c *gin.Context) {
	var rsp proto.Response

	updateMutex.Lock()
	if isUpdating {
		updateMutex.Unlock()
		rsp.ErrRsp(c, -1, "update already in progress")
		return
	}
	isUpdating = true
	updateMutex.Unlock()

	defer func() {
		updateMutex.Lock()
		isUpdating = false
		updateMutex.Unlock()
	}()

	if err := update(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("update failed: %s", err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update application success")

	// Sleep for a second before restarting the device
	time.Sleep(1 * time.Second)

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func update() error {
	_ = os.RemoveAll(CacheDir)
	_ = os.MkdirAll(CacheDir, 0o755)
	defer func() {
		_ = os.RemoveAll(CacheDir)
	}()

	// get latest information
	latest, err := getLatest()
	if err != nil {
		return err
	}

	// download
	target := fmt.Sprintf("%s/%s", CacheDir, latest.Name)

	if err := download(latest.Url, target); err != nil {
		log.Errorf("download app failed: %s", err)
		return err
	}

	// check sha512
	if err := checksum(target, latest.Sha512); err != nil {
		log.Errorf("check sha512 failed: %s", err)
		return err
	}

	// decompress
	dir, err := utils.UnTarGz(target, CacheDir)
	log.Debugf("untar: %s", dir)
	if err != nil {
		log.Errorf("decompress app failed: %s", err)
		return err
	}

	// backup old version
	if err := os.RemoveAll(BackupDir); err != nil {
		log.Errorf("remove backup failed: %s", err)
		return err
	}

	if err := utils.MoveFilesRecursively(AppDir, BackupDir); err != nil {
		log.Errorf("backup app failed: %s", err)
		return err
	}

	// update
	if err := utils.MoveFilesRecursively(dir, AppDir); err != nil {
		log.Errorf("failed to move update back in place: %s", err)
		return err
	}

	// modify permissions
	if err := utils.ChmodRecursively(AppDir, 0o755); err != nil {
		log.Errorf("chmod failed: %s", err)
		return err
	}

	return nil
}

func download(url string, target string) (err error) {
	for i := range maxTries {
		log.Debugf("attempt #%d/%d", i+1, maxTries)
		if i > 0 {
			time.Sleep(time.Second * 3) // wait for 3 seconds before retrying the download attempt
		}

		var req *http.Request
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			log.Errorf("new request err: %s", err)
			continue
		}

		log.Debugf("update will be saved to: %s", target)
		err = utils.Download(req, target)
		if err != nil {
			log.Errorf("downloading latest application failed, try again...")
			continue
		}
		return nil
	}
	return err
}

func checksum(filePath string, expectedHash string) error {
	file, err := os.Open(filePath)
	if err != nil {
		log.Errorf("failed to open file %s: %v", filePath, err)
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	hasher := sha512.New()

	_, err = io.Copy(hasher, file)
	if err != nil {
		log.Errorf("failed to copy file contents to hasher: %v", err)
		return err
	}

	hash := base64.StdEncoding.EncodeToString(hasher.Sum(nil))

	if hash != expectedHash {
		log.Errorf("invalid sha512 %s", hash)
		return fmt.Errorf("invalid sha512 %s", hash)
	}

	return nil
}

type loggingWriter struct {
	writer    io.Writer
	total     int64
	totalSize int64
	ticker    *time.Ticker
	done      chan bool
}

func (lw *loggingWriter) startTicker() {
	lw.ticker = time.NewTicker(2500 * time.Millisecond)
	lw.done = make(chan bool)
	go func() {
		for {
			select {
			case <-lw.done:
				return
			case <-lw.ticker.C:
				lw.updateSentinel()
			}
		}
	}()
}

func (lw *loggingWriter) stopTicker() {
	lw.ticker.Stop()
	lw.done <- true
}

func (lw *loggingWriter) updateSentinel() {
	percentage := float64(lw.total) / float64(lw.totalSize) * 100
	content, err := os.ReadFile(sentinelPath)
	if err != nil {
		log.Error("Failed to read sentinel file")
		return
	}
	splitted := strings.Split(string(content), ";")
	if len(splitted) == 0 {
		return
	}
	err = os.WriteFile(sentinelPath, []byte(fmt.Sprintf("%s;%.2f%%", splitted[0], percentage)), 0644)
	if err != nil {
		log.Error("Failed to update sentinel file")
	}
}

func (lw *loggingWriter) Write(p []byte) (int, error) {
	n, err := lw.writer.Write(p)
	lw.total += int64(n)
	return n, err
}

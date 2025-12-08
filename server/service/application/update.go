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

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
)

const (
	maxTries = 3
)

var (
	updateMutex sync.Mutex
	isUpdating  bool
)

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

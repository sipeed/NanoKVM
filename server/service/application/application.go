package application

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
)

const (
	maxTries = 3
)

func (s *Service) GetVersion(c *gin.Context) {
	var rsp proto.Response
	log.Debugf("get version api triggered")

	// current version
	currentVersion := "1.0.0"
	content, err := os.ReadFile(versionFile)
	if err == nil {
		currentVersion = strings.ReplaceAll(string(content), "\n", "")
	}
	log.Debugf("current version: %s", currentVersion)

	// latest version
	url := fmt.Sprintf("%s?now=%d", versionURL, time.Now().Unix())
	resp, err := http.Get(url)
	if err != nil {
		log.Debugf("get latest version failed: %v", err)
		rsp.ErrRsp(c, -2, "Unable to access sipeed.com. Please check your network.")
		return
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Errorf("read body failed: %v", err)
		rsp.ErrRsp(c, -4, "read body failed")
		return
	}

	if resp.StatusCode != http.StatusOK {
		log.Errorf("server responded with status code: %d", resp.StatusCode)
		rsp.ErrRsp(c, -3, fmt.Sprintf("get version failed, server returns status code: %d, body: %s", resp.StatusCode, string(body)))
		return
	}

	latestVersion := strings.ReplaceAll(string(body), "\n", "")

	rsp.OkRspWithData(c, &proto.GetVersionRsp{
		Current: currentVersion,
		Latest:  latestVersion,
	})
}

func (s *Service) Update(c *gin.Context) {
	var rsp proto.Response
	log.Debugf("update application api triggered")

	if err := updateApp(); err != nil {
		log.Debugf("update failed: %s", err)
		rsp.ErrRsp(c, -1, fmt.Sprintf("update failed: %s", err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update application success")

	// Sleep for a second before restarting the device
	time.Sleep(1 * time.Second)

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func updateApp() error {
	log.Debugf("update application")
	_ = os.RemoveAll(temporary)
	_ = os.MkdirAll(temporary, 0o755)
	defer func() {
		_ = os.RemoveAll(temporary)
	}()

	if err := downloadLib(); err != nil {
		log.Errorf("download lib failed: %s", err)
		return err
	}

	if err := downloadApp(); err != nil {
		log.Errorf("download app failed: %s", err)
		return err
	}

	err := utils.MoveFile(temporary+"/"+libName, temporary+"/latest/kvm_system/dl_lib/"+libName) // move lib
	if err != nil {
		log.Errorf("rename lib failed: %s", err)
		return err
	}

	// backup old version
	err = os.RemoveAll(backup)
	if err != nil {
		log.Errorf("remove backup failed: %s", err)
		return err
	}

	err = utils.MoveFilesRecursively(workspace, backup)
	if err != nil {
		log.Errorf("backuping old libraries failed: %s", err)
		return err
	}

	// update
	err = utils.MoveFilesRecursively(temporary+"/latest", workspace)
	if err != nil {
		log.Errorf("failed to move update back in place: %s", err)
		return err
	}

	// modify permissions
	err = utils.ChmodRecursively(workspace, 0o755)
	if err != nil {
		log.Errorf("chmod failed: %s", err)
		return err
	}

	return nil
}

func downloadApp() error {
	var err error
	log.Debugf("downloading latest application...")
	url := fmt.Sprintf("%s?now=%d", applicationURL, time.Now().Unix())
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

		zipFile := temporary + "/latest.zip"
		log.Debugf("update will be saved to: %s", zipFile)
		err = utils.Download(req, zipFile)
		if err != nil {
			log.Errorf("downloading latest application failed, try again...")
			continue
		}

		err = utils.Unzip(zipFile, temporary)
		if err != nil {
			log.Errorf("unzip app failed: %s", err)
			continue
		}

		return nil
	}
	return err
}

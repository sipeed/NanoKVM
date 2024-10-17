package application

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) GetLib(c *gin.Context) {
	var rsp proto.Response

	exist, err := isLibExist()
	if err != nil {
		rsp.ErrRsp(c, -1, "check lib error")
		return
	}

	data := &proto.GetLibRsp{
		Exist: exist,
	}

	rsp.OkRspWithData(c, data)
	log.Debugf("get lib success, exist: %t", exist)
}

func (s *Service) UpdateLib(c *gin.Context) {
	var rsp proto.Response

	exist, _ := isLibExist()
	if exist {
		rsp.OkRsp(c)
		return
	}

	_ = os.MkdirAll(temporary, 0o755)
	defer func() {
		_ = os.RemoveAll(temporary)
	}()

	if err := downloadLib(); err != nil {
		rsp.ErrRsp(c, -1, "download lib failed")
		return
	}

	err := utils.MoveFile(temporary+"/"+libName, libDir+"/"+libName) // update lib
	if err != nil {
		rsp.ErrRsp(c, -2, "update lib failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update lib success")

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func isLibExist() (bool, error) {
	libPath := fmt.Sprintf("%s/%s", libDir, libName)
	_, err := os.Stat(libPath)

	if err == nil {
		return true, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}

	return false, err
}

func downloadLib() error {
	log.Debugf("downloading libs...")
	content, err := os.ReadFile("/device_key")
	if err != nil {
		log.Errorf("error reading device key: %s", err)
		return err
	}
	deviceKey := strings.ReplaceAll(string(content), "\n", "")

	for i := range maxTries {
		log.Debugf("attempt #%d/%d", i+1, maxTries)
		if i > 0 {
			time.Sleep(time.Second * 3) // wait for 3 seconds before retrying the download attempt
		}

		var req *http.Request
		url := fmt.Sprintf("%s?uid=%s", libURL, deviceKey)
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			log.Errorf("error creating new request: %s", err)
			continue
		}
		req.Header.Set("token", "MaixVision2024")

		target := fmt.Sprintf("%s/%s", temporary, libName)

		err = utils.Download(req, target)
		if err != nil {
			log.Errorf("downloading lib failed: %s", err)
			continue
		}
		return nil
	}
	return err
}

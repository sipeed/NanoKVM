package application

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"os/exec"
	"strings"
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

	cleanCmd := exec.Command("sh", "-c", fmt.Sprintf("rm -rf %s", Temporary))
	_ = cleanCmd.Run()
	_ = os.MkdirAll(Temporary, 0755)
	defer cleanCmd.Run()

	if err := downloadLib(); err != nil {
		rsp.ErrRsp(c, -1, "download lib failed")
		return
	}

	command := fmt.Sprintf("mv -f %s/%s %s/", Temporary, LibName, LibDir) // update lib
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		rsp.ErrRsp(c, -2, "update lib failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update lib success")

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func isLibExist() (bool, error) {
	libPath := fmt.Sprintf("%s/%s", LibDir, LibName)
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
	content, err := os.ReadFile("/device_key")
	if err != nil {
		log.Errorf("read devcie key err: %s", err)
		return err
	}
	deviceKey := strings.ReplaceAll(string(content), "\n", "")

	url := fmt.Sprintf("%s?uid=%s", LibURL, deviceKey)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Errorf("new request err: %s", err)
		return err
	}
	req.Header.Set("token", "MaixVision2024")

	target := fmt.Sprintf("%s/%s", Temporary, LibName)

	return utils.Download(req, target)
}

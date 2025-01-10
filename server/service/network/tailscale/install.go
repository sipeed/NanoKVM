package tailscale

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	DownloadUrl = "https://cdn.sipeed.com/nanokvm/resources/tailscale_riscv64.zip"
	Workspace   = "/root/.tailscale"

	TailscalePath  = "/usr/bin/tailscale"
	TailscaledPath = "/usr/sbin/tailscaled"
)

func Install(c *gin.Context) {
	var rsp proto.Response

	if IsInstalled() {
		rsp.OkRsp(c)
		return
	}

	_ = os.MkdirAll(Workspace, 0o755)
	defer func() {
		_ = os.RemoveAll(Workspace)
	}()

	// download
	req, err := http.NewRequest("GET", DownloadUrl, nil)
	if err != nil {
		rsp.ErrRsp(c, -1, "request failed")
		log.Errorf("failed to create request: %s", err)
		return
	}

	zipPath := fmt.Sprintf("%s/tailscale_riscv64.zip", Workspace)
	err = utils.Download(req, zipPath)
	if err != nil {
		rsp.ErrRsp(c, -2, "download failed")
		log.Errorf("failed to download tailscale: %s", err)
		return
	}

	// install
	err = utils.Unzip(zipPath, Workspace)
	if err != nil {
		rsp.ErrRsp(c, -3, "unzip failed")
		log.Errorf("failed to unzip tailscale: %s", err)
		return
	}

	tailscalePath := fmt.Sprintf("%s/tailscale_riscv64/tailscale", Workspace)
	err = utils.MoveFile(tailscalePath, TailscalePath)
	if err != nil {
		rsp.ErrRsp(c, -4, "install failed")
		log.Errorf("failed to move tailscale: %s", err)
		return
	}

	tailscaledPath := fmt.Sprintf("%s/tailscale_riscv64/tailscaled", Workspace)
	err = utils.MoveFile(tailscaledPath, TailscaledPath)
	if err != nil {
		rsp.ErrRsp(c, -5, "install failed")
		log.Errorf("failed to move tailscaled: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("install tailscale successfully")
}

func Uninstall(c *gin.Context) {
	var rsp proto.Response

	_ = NewCli().Stop()
	_ = utils.DelGoMemLimit()

	_ = os.Remove(TailscalePath)
	_ = os.Remove(TailscaledPath)

	rsp.OkRsp(c)
	log.Debugf("uninstall tailscale successfully")
}

func IsInstalled() bool {
	_, err1 := os.Stat(TailscalePath)
	_, err2 := os.Stat(TailscaledPath)

	return err1 == nil && err2 == nil
}

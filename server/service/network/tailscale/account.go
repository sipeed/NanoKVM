package tailscale

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func Login(c *gin.Context) {
	var rsp proto.Response

	// check tailscale status
	cli := NewCli()
	status, err := cli.Status()
	if err != nil {
		_ = cli.Start()
		status, err = cli.Status()
	}

	if err != nil {
		log.Errorf("failed to get tailscale status: %s", err)
		rsp.ErrRsp(c, -1, "unknown status")
		return
	}

	if status.BackendState == "Running" {
		rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{})
		return
	}

	// get login url
	url, err := cli.Login()
	if err != nil {
		log.Errorf("failed to run tailscale login: %s", err)
		rsp.ErrRsp(c, -2, "login failed")
		return
	}

	// set GOMEMLIMIT = 50M
	if !utils.IsGoMemLimitExist() {
		_ = utils.SetGoMemLimit(50)
	}

	rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{
		Url: url,
	})

	log.Debugf("tailscale login url: %s", url)
}

func Logout(c *gin.Context) {
	var rsp proto.Response

	err := NewCli().Logout()
	if err != nil {
		rsp.ErrRsp(c, -1, "logout failed")
		log.Errorf("failed to run tailscale logout: %s", err)
		return
	}

	// delete GOMEMLIMIT
	_ = utils.DelGoMemLimit()

	rsp.OkRsp(c)
	log.Debugf("tailscale logout successfully")
}

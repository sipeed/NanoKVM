package vm

import (
	"NanoKVM-Server/proto"
	"errors"
	"fmt"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	SSHScript   = "/etc/init.d/S50sshd"
	SSHStopFlag = "/etc/kvm/ssh_stop"
)

func (s *Service) GetSSHState(c *gin.Context) {
	var rsp proto.Response

	enabled := isSSHEnabled()
	rsp.OkRspWithData(c, &proto.GetSSHStateRsp{
		Enabled: enabled,
	})
}

func (s *Service) EnableSSH(c *gin.Context) {
	var rsp proto.Response

	command := fmt.Sprintf("%s permanent_on", SSHScript)
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("failed to run SSH script: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("SSH enabled")
}

func (s *Service) DisableSSH(c *gin.Context) {
	var rsp proto.Response

	command := fmt.Sprintf("%s permanent_off", SSHScript)
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("failed to run SSH script: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("SSH disabled")
}

func isSSHEnabled() bool {
	_, err := os.Stat(SSHStopFlag)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return true
		}
	}

	return false
}

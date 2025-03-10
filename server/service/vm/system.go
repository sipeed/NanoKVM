package vm

import (
	"NanoKVM-Server/proto"
	"os/exec"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) Reboot(c *gin.Context) {
	var rsp proto.Response

	log.Println("reboot system...")

	err := exec.Command("reboot").Run()
	if err != nil {
		rsp.ErrRsp(c, -1, "operation failed")
		log.Errorf("failed to reboot: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debug("system rebooted")
}

package vm

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) ResetHdmi(c *gin.Context) {
	var rsp proto.Response

	vision := common.GetKvmVision()

	vision.EnableHdmi(false)
	time.Sleep(1 * time.Second)
	vision.EnableHdmi(true)

	rsp.OkRsp(c)
	log.Debug("reset hdmi")
}

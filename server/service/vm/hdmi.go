package vm

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// ideally read state from the device
var hdmiEnabled = true

func (s *Service) ResetHdmi(c *gin.Context) {
	var rsp proto.Response

	vision := common.GetKvmVision()

	vision.SetHDMI(false)
	time.Sleep(1 * time.Second)
	vision.SetHDMI(true)
	hdmiEnabled = true

	rsp.OkRsp(c)
	log.Debug("reset hdmi")
}

func (s *Service) EnableHdmi(c *gin.Context) {
	var rsp proto.Response

	vision := common.GetKvmVision()

	vision.SetHDMI(true)
	hdmiEnabled = true

	rsp.OkRsp(c)
	log.Debug("enable hdmi")
}

func (s *Service) DisableHdmi(c *gin.Context) {
	var rsp proto.Response

	vision := common.GetKvmVision()

	vision.SetHDMI(false)
	hdmiEnabled = false

	rsp.OkRsp(c)
	log.Debug("disable hdmi")
}

func (s *Service) GetHdmiState(c *gin.Context) {
	var rsp proto.Response

	if hdmiEnabled {
		rsp.OkRspWithData(c, &map[string]string{
			"state": "enabled",
		})
	} else {
		rsp.OkRspWithData(c, &map[string]string{
			"state": "disabled",
		})
	}

	log.Debug("get hdmi state")
}

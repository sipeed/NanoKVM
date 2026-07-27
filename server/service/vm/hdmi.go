package vm

import (
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) ResetHdmi(c *gin.Context) {
	var rsp proto.Response

	DisableHdmiCapture()
	time.Sleep(1 * time.Second)
	EnableHdmiCapture()
	utils.PersistHDMIEnabled()

	rsp.OkRsp(c)
	log.Debug("reset hdmi")
}

func (s *Service) EnableHdmi(c *gin.Context) {
	var rsp proto.Response

	EnableHdmiCapture()
	utils.PersistHDMIEnabled()

	rsp.OkRsp(c)
	log.Debug("enable hdmi")
}

func (s *Service) DisableHdmi(c *gin.Context) {
	var rsp proto.Response

	DisableHdmiCapture()
	utils.PersistHDMIDisabled()

	rsp.OkRsp(c)
	log.Debug("disable hdmi")
}

func (s *Service) GetHdmiState(c *gin.Context) {
	var rsp proto.Response

	rsp.OkRspWithData(c, &proto.GetGetHdmiStateRsp{
		Enabled: !utils.IsHdmiDisabled(),
	})

	log.Debug("get hdmi state")
}

func EnableHdmiCapture() {
	common.GetKvmVision().SetHDMI(true)
}

func DisableHdmiCapture() {
	common.GetKvmVision().SetHDMI(false)
}

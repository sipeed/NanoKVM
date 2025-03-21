package mjpeg

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const FrameDetectInterval uint8 = 60

func UpdateFrameDetect(c *gin.Context) {
	var req proto.UpdateFrameDetectReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	var frame uint8 = 0
	if req.Enabled {
		frame = FrameDetectInterval
	}

	common.GetKvmVision().SetFrameDetect(frame)

	rsp.OkRsp(c)
	log.Debugf("update frame detect: %t", req.Enabled)
}

func StopFrameDetect(c *gin.Context) {
	var req proto.StopFrameDetectReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	duration := 10 * time.Second
	if req.Duration > 0 {
		duration = time.Duration(req.Duration) * time.Second
	}

	vision := common.GetKvmVision()

	vision.SetFrameDetect(0)
	time.Sleep(duration)
	vision.SetFrameDetect(FrameDetectInterval)

	rsp.OkRsp(c)
}

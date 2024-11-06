package vm

import (
	"NanoKVM-Server/common"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

var screenFileMap = map[string]string{
	"type":       "/kvmapp/kvm/type",
	"fps":        "/kvmapp/kvm/fps",
	"quality":    "/kvmapp/kvm/qlty",
	"resolution": "/kvmapp/kvm/res",
}

func (s *Service) SetScreen(c *gin.Context) {
	var req proto.SetScreenReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	file, ok := screenFileMap[req.Type]
	if !ok {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	data := fmt.Sprintf("%d", req.Value)
	if req.Type == "type" {
		if req.Value == 0 {
			data = "mjpeg"
		} else {
			data = "h264"
		}
	}

	err := os.WriteFile(file, []byte(data), 0o666)
	if err != nil {
		log.Errorf("write kvm %s failed: %s", file, err)
		rsp.ErrRsp(c, -3, "update screen failed")
		return
	}

	common.SetScreen(req.Type, req.Value)

	log.Debugf("update screen: %+v", req)
	rsp.OkRsp(c)
}

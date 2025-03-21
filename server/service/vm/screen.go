package vm

import (
	"NanoKVM-Server/common"
	"fmt"
	"os"
	"strconv"

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

	err := proto.ParseFormRequest(c, &req)
	if err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	switch req.Type {
	case "type":
		data := "h264"
		if req.Value == 0 {
			data = "mjpeg"
		}
		err = writeScreen("type", data)

	case "gop":
		gop := 30
		if req.Value >= 1 && req.Value <= 100 {
			gop = req.Value
		}
		common.GetKvmVision().SetGop(uint8(gop))

	default:
		data := strconv.Itoa(req.Value)
		err = writeScreen(req.Type, data)
	}

	if err != nil {
		rsp.ErrRsp(c, -2, "update screen failed")
		return
	}

	common.SetScreen(req.Type, req.Value)

	log.Debugf("update screen: %+v", req)
	rsp.OkRsp(c)
}

func writeScreen(key string, value string) error {
	file, ok := screenFileMap[key]
	if !ok {
		return fmt.Errorf("invalid argument %s", key)
	}

	err := os.WriteFile(file, []byte(value), 0o666)
	if err != nil {
		log.Errorf("write kvm %s failed: %s", file, err)
		return err
	}

	return nil
}

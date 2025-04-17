package vm

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/vm/jiggler"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) GetMouseJiggler(c *gin.Context) {
	var rsp proto.Response

	mouseJiggler := jiggler.GetJiggler()

	data := &proto.GetMouseJigglerRsp{
		Enabled: mouseJiggler.IsEnabled(),
		Mode:    mouseJiggler.GetMode(),
	}

	rsp.OkRspWithData(c, data)
}

func (s *Service) SetMouseJiggler(c *gin.Context) {
	var req proto.SetMouseJigglerReq
	var rsp proto.Response

	err := proto.ParseFormRequest(c, &req)
	if err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	mouseJiggler := jiggler.GetJiggler()

	if req.Enabled {
		err = mouseJiggler.Enable(req.Mode)
	} else {
		err = mouseJiggler.Disable()
	}

	if err != nil {
		rsp.ErrRsp(c, -2, "operation failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set mouse jiggler: %t", req.Enabled)
}

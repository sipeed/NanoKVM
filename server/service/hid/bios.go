package hid

import (
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) GetBiosMode(c *gin.Context) {
	var rsp proto.Response

	mode, err := getBiosMode()
	if err != nil {
		rsp.ErrRsp(c, -1, "get HID BIOS mode failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetBiosModeRsp{
		Mode: mode,
	})
	log.Debugf("get hid bios mode: %s", mode)
}

func (s *Service) SetBiosMode(c *gin.Context) {
	var req proto.SetBiosModeReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	if req.Mode != ModeNonBios && req.Mode != ModeHidBios {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if mode, _ := getBiosMode(); req.Mode == mode {
		rsp.OkRsp(c)
		return
	}

	hidmode, _ := getHidMode()
	wowmode, _ := getWoWMode();

	msg, err := setHidMode(hidmode, req.Mode, wowmode)
	if err != nil {
		rsp.ErrRsp(c, -2, msg)
		return
	}

	msg, err = setBootBios(req.Mode)
	if err != nil {
		rsp.ErrRsp(c, -4, msg)
		return
	}

	rsp.OkRsp(c)
}

package hid

import (
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) GetWoWMode(c *gin.Context) {
	var rsp proto.Response

	mode, err := getWoWMode()
	if err != nil {
		rsp.ErrRsp(c, -1, "get HID Wake on Write mode failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetWoWModeRsp{
		Mode: mode,
	})
	log.Debugf("get hid wow mode: %s", mode)
}

func (s *Service) SetWoWMode(c *gin.Context) {
	var req proto.SetWoWModeReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	if req.Mode != ModeNoWoW && req.Mode != ModeHidWoW {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if mode, _ := getWoWMode(); req.Mode == mode {
		rsp.OkRsp(c)
		return
	}

	hidmode, _ := getHidMode()
	biosmode, _ := getBiosMode();

	msg, err := setHidMode(hidmode, biosmode, req.Mode)
	if err != nil {
		rsp.ErrRsp(c, -2, msg)
		return
	}

	msg, err = setBootWoW(req.Mode)
	if err != nil {
		rsp.ErrRsp(c, -3, msg)
		return
	}

	rsp.OkRsp(c)
}

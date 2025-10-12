package hid

import (
	"NanoKVM-Server/proto"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	BiosFile = "/boot/BIOS"
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

	biosboot, _ := isFuncExist(BiosFile)
	if !biosboot && req.Mode == ModeHidBios {
		if err := os.WriteFile(BiosFile, []byte("\n"), 0o666); err != nil {
			log.Errorf("write bios file failed: %s", err)
			rsp.ErrRsp(c, -2, "write bios file failed")
			return
		}
	} else if biosboot && req.Mode != ModeHidBios {
		if err := os.Remove(BiosFile); err != nil {
			log.Errorf("remove bios file failed: %s", err)
			rsp.ErrRsp(c, -2, "remove bios file failed")
			return
		}
	}

	hidmode, _ := getHidMode()

	msg, err := setHidMode(hidmode, req.Mode)
	if err != nil {
		rsp.ErrRsp(c, -2, msg)
		return
	}

	rsp.OkRsp(c)
}

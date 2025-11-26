package vm

import (
	"os"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	WebTitleFile = "/etc/kvm/web-title"
)

func (s *Service) SetWebTitle(c *gin.Context) {
	var req proto.SetWebTitleReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if req.Title == "" || req.Title == "NanoKVM" {
		err := os.Remove(WebTitleFile)
		if err != nil {
			rsp.ErrRsp(c, -2, "reset failed")
			return
		}
	} else {
		err := os.WriteFile(WebTitleFile, []byte(req.Title), 0o644)
		if err != nil {
			rsp.ErrRsp(c, -3, "write failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("set web title: %s", req.Title)
}

func (s *Service) GetWebTitle(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(WebTitleFile)
	if err != nil {
		rsp.ErrRsp(c, -1, "read web title failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetWebTitleRsp{
		Title: strings.Replace(string(data), "\n", "", -1),
	})

	log.Debugf("get web title successful")
}

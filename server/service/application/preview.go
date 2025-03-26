package application

import (
	"NanoKVM-Server/proto"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	PreviewUpdatesFlag = "/etc/kvm/preview_updates"
)

func (s *Service) GetPreview(c *gin.Context) {
	var rsp proto.Response

	isEnabled := isPreviewEnabled()

	rsp.OkRspWithData(c, &proto.GetPreviewRsp{
		Enabled: isEnabled,
	})
}

func (s *Service) SetPreview(c *gin.Context) {
	var req proto.SetPreviewReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if req.Enable == isPreviewEnabled() {
		rsp.OkRsp(c)
		return
	}

	if req.Enable {
		if err := os.WriteFile(PreviewUpdatesFlag, []byte("1"), 0o644); err != nil {
			log.Errorf("failed to write %s: %s", PreviewUpdatesFlag, err)
			rsp.ErrRsp(c, -2, "enable failed")
			return
		}
	} else {
		if err := os.Remove(PreviewUpdatesFlag); err != nil {
			log.Errorf("failed to remove %s: %s", PreviewUpdatesFlag, err)
			rsp.ErrRsp(c, -3, "disable failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("set preview updates state: %t", req.Enable)
}

func isPreviewEnabled() bool {
	_, err := os.Stat(PreviewUpdatesFlag)
	return err == nil
}

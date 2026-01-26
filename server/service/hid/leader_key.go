package hid

import (
	"os"
	"strings"

	"NanoKVM-Server/proto"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	LeaderKeyFile = "/etc/kvm/leader-key"
)

func (s *Service) SetLeaderKey(c *gin.Context) {
	var req proto.SetLeaderKeyReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if req.Key == "" {
		err := os.Remove(LeaderKeyFile)
		if err != nil && !os.IsNotExist(err) {
			rsp.ErrRsp(c, -2, "reset failed")
			return
		}
	} else {
		err := os.WriteFile(LeaderKeyFile, []byte(req.Key), 0o644)
		if err != nil {
			rsp.ErrRsp(c, -3, "write failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("set leader key: %s", req.Key)
}

func (s *Service) GetLeaderKey(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(LeaderKeyFile)
	if err != nil {
		if os.IsNotExist(err) {
			rsp.OkRspWithData(c, &proto.GetLeaderKeyRsp{
				Key: "",
			})
			return
		}
		rsp.ErrRsp(c, -1, "read leader key failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetLeaderKeyRsp{
		Key: strings.Replace(string(data), "\n", "", -1),
	})

	log.Debugf("get leader key successful")
}

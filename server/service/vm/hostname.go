package vm

import (
	"NanoKVM-Server/proto"
	"fmt"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	HostnameFile = "/etc/hostname"
)

func (s *Service) SetHostname(c *gin.Context) {
	var req proto.SetHostnameReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	data := []byte(fmt.Sprintf("%s", req.Hostname))

	err := os.WriteFile(HostnameFile, data, 0o644)
	if err != nil {
		rsp.ErrRsp(c, -2, "failed to write data")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set Hostname: %s", req.Hostname)
}

func (s *Service) GetHostname(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(HostnameFile)
	if err != nil {
		rsp.ErrRsp(c, -1, "read Hostname failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetHostnameRsp{
		Hostname: strings.Replace(string(data), "\n", "", -1),
	})
	log.Debugf("get Hostname successful")
}

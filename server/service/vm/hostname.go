package vm

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	BootHostnameFile = "/boot/hostname"
	EtcHostname      = "/etc/hostname"
	EtcHosts         = "/etc/hosts"
)

func (s *Service) SetHostname(c *gin.Context) {
	var req proto.SetHostnameReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	dataRead, err := os.ReadFile(EtcHostname)
	if err != nil {
		rsp.ErrRsp(c, -1, "read Hostname failed")
		return
	}

	oldHostname := strings.Replace(string(dataRead), "\n", "", -1)

	if (oldHostname != req.Hostname) {
		dataRead, err = os.ReadFile(EtcHosts)
		if err != nil {
			rsp.ErrRsp(c, -1, "read Hosts failed")
			return
		}

		data := []byte(strings.Replace(string(dataRead), oldHostname, req.Hostname, -1))

		if err := os.WriteFile(EtcHosts, data, 0o644); err != nil {
			rsp.ErrRsp(c, -2, "failed to write data")
			return
		}
	}

	data := []byte(fmt.Sprintf("%s", req.Hostname))

	if err := os.WriteFile(BootHostnameFile, data, 0o644); err != nil {
		rsp.ErrRsp(c, -2, "failed to write data")
		return
	}

	if err := os.WriteFile(EtcHostname, data, 0o644); err != nil {
		rsp.ErrRsp(c, -3, "failed to write data")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set Hostname: %s", req.Hostname)

	_ = exec.Command("hostname", "-F", EtcHostname).Run()
}

func (s *Service) GetHostname(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(EtcHostname)
	if err != nil {
		rsp.ErrRsp(c, -1, "read Hostname failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetHostnameRsp{
		Hostname: strings.Replace(string(data), "\n", "", -1),
	})
	log.Debugf("get Hostname successful")
}

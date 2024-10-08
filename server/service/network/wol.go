package network

import (
	"NanoKVM-Server/proto"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const (
	WolHistory = "/etc/kvm/cache/wol"
)

func (s *Service) WakeOnLAN(c *gin.Context) {
	var req proto.WakeOnLANReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	command := fmt.Sprintf("ether-wake %s", req.Mac)
	cmd := exec.Command("sh", "-c", command)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Errorf("wake on lan failed: %s", err)
		rsp.ErrRsp(c, -2, string(output))
		return
	}

	go saveMac(req.Mac)

	rsp.OkRsp(c)
	log.Debugf("wake on lan %s success", req.Mac)
}

func (s *Service) GetMac(c *gin.Context) {
	var rsp proto.Response

	content, err := os.ReadFile(WolHistory)
	if err != nil {
		rsp.ErrRsp(c, -2, "open file error")
		return
	}

	macs := strings.Split(string(content), "\n")
	data := &proto.GetMacRsp{
		Macs: macs,
	}

	rsp.OkRspWithData(c, data)
}

func (s *Service) DeleteMac(c *gin.Context) {
	var req proto.DeleteMacReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	content, err := os.ReadFile(WolHistory)
	if err != nil {
		log.Errorf("open %s failed: %s", WolHistory, err)
		rsp.ErrRsp(c, -2, "read failed")
		return
	}

	macs := strings.Split(string(content), "\n")
	var newMacs []string

	for _, mac := range macs {
		if req.Mac != mac {
			newMacs = append(newMacs, mac)
		}
	}

	data := strings.Join(newMacs, "\n")
	err = os.WriteFile(WolHistory, []byte(data), 0644)
	if err != nil {
		log.Errorf("write %s failed: %s", WolHistory, err)
		rsp.ErrRsp(c, -3, "write failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete mac %s success", req.Mac)
}

func saveMac(mac string) {
	if isMacExist(mac) {
		return
	}

	err := os.MkdirAll(filepath.Dir(WolHistory), 0644)
	if err != nil {
		log.Errorf("create dir failed: %s", err)
		return
	}

	file, err := os.OpenFile(WolHistory, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open %s failed: %s", WolHistory, err)
		return
	}
	defer file.Close()

	content := fmt.Sprintf("%s\n", mac)
	_, err = file.WriteString(content)
	if err != nil {
		log.Errorf("write %s failed: %s", WolHistory, err)
		return
	}
}

func isMacExist(mac string) bool {
	content, err := os.ReadFile(WolHistory)
	if err != nil {
		return false
	}

	macs := strings.Split(string(content), "\n")
	for _, item := range macs {
		if mac == item {
			return true
		}
	}

	return false
}

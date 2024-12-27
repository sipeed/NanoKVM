package network

import (
	"NanoKVM-Server/proto"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	WiFiExistFile = "/etc/kvm/wifi_exist"
	WiFiStateFile = "/kvmapp/kvm/wifi_state"
)

func (s *Service) GetWifi(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetWifiRsp{}

	_, err := os.Stat(WiFiExistFile)
	if err != nil {
		rsp.OkRspWithData(c, data)
		return
	}

	data.Supported = true

	content, err := os.ReadFile(WiFiStateFile)
	if err != nil {
		rsp.OkRspWithData(c, data)
		return
	}

	state := strings.ReplaceAll(string(content), "\n", "")
	data.Connected = state == "1"

	rsp.OkRspWithData(c, data)
	log.Debugf("get wifi state: %s", state)
}

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
	WiFiSSID      = "/etc/kvm/wifi.ssid"
	WiFiPasswd    = "/etc/kvm/wifi.pass"
	WiFiConnect   = "/kvmapp/kvm/wifi_try_connect"
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

func (s *Service) ConnectWifi(c *gin.Context) {
	var req proto.ConnectWifiReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if err := os.WriteFile(WiFiSSID, []byte(req.Ssid), 0o644); err != nil {
		log.Errorf("failed to save wifi ssid: %s", err)
		rsp.ErrRsp(c, -2, "failed to save wifi")
		return
	}

	if err := os.WriteFile(WiFiPasswd, []byte(req.Password), 0o644); err != nil {
		log.Errorf("failed to save wifi password: %s", err)
		rsp.ErrRsp(c, -3, "failed to save wifi")
		return
	}

	if err := os.WriteFile(WiFiConnect, nil, 0o644); err != nil {
		log.Errorf("failed to connect wifi: %s", err)
		rsp.ErrRsp(c, -4, "failed to connect wifi")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set wifi successfully: %s", req.Ssid)
}

package network

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	WiFiExistFile  = "/etc/kvm/wifi_exist"
	WiFiApModeFile = "/tmp/wifiap"
	WiFiSSID       = "/etc/kvm/wifi.ssid"
	WiFiPasswd     = "/etc/kvm/wifi.pass"
	WiFiConnect    = "/kvmapp/kvm/wifi_try_connect"
	WiFiStateFile  = "/kvmapp/kvm/wifi_state"
	WiFiScript     = "/etc/init.d/S30wifi"
)

func (s *Service) GetWifi(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetWifiRsp{}

	data.Supported = isSupported()
	if !data.Supported {
		rsp.OkRspWithData(c, data)
		return
	}

	data.ApMode = isAPMode()

	data.Connected = isConnected()
	if !data.Connected {
		rsp.OkRspWithData(c, data)
		return
	}

	data.Ssid = getWiFiSsid()
	if data.Ssid == "" {
		data.Ssid = "Wi-Fi"
	}

	rsp.OkRspWithData(c, data)
	log.Debugf("get wifi state: %+v", data)
}

func (s *Service) ConnectWifiNoAuth(c *gin.Context) {
	var req proto.ConnectWifiReq
	var rsp proto.Response

	// Check Wi-Fi configuration mode
	if !isSupported() || !isAPMode() {
		time.Sleep(2 * time.Second)
		rsp.ErrRsp(c, -1, "invalid mode")
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		time.Sleep(1 * time.Second)
		rsp.ErrRsp(c, -2, "invalid parameters")
		return
	}

	if err := connect(req.Ssid, req.Password); err != nil {
		rsp.ErrRsp(c, -3, "failed to connect wifi")
		return
	}

	time.Sleep(5 * time.Second)

	rsp.OkRsp(c)
	log.Debugf("set wifi ap mode successfully")
}

func (s *Service) ConnectWifi(c *gin.Context) {
	var req proto.ConnectWifiReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if err := connect(req.Ssid, req.Password); err != nil {
		rsp.ErrRsp(c, -2, "failed to connect wifi")
		return
	}

	// Waiting for Wi-Fi connection
	maxTries := 7
	if isConnected() {
		maxTries = 3
		time.Sleep(12 * time.Second)
	}

	for range maxTries {
		time.Sleep(2 * time.Second)

		if isConnected() && getWiFiSsid() != "" {
			rsp.OkRsp(c)
			log.Debugf("set wifi successfully: %s", req.Ssid)
			return
		}
	}

	rsp.ErrRsp(c, -3, "failed to get wifi status")
	return
}

func (s *Service) DisconnectWifi(c *gin.Context) {
	var rsp proto.Response

	command := fmt.Sprintf("%s stop", WiFiScript)
	cmd := exec.Command("sh", "-c", command)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Errorf("failed to disconnect wifi: %s", output)
		rsp.ErrRsp(c, -1, "failed to stop wifi")
		return
	}

	time.Sleep(5 * time.Second)

	_ = os.Remove(WiFiSSID)
	_ = os.Remove(WiFiPasswd)

	rsp.OkRsp(c)
	log.Debugf("stop wifi successfully")
}

func connect(ssid string, password string) error {
	if err := os.WriteFile(WiFiSSID, []byte(ssid), 0o644); err != nil {
		log.Errorf("failed to save wifi ssid: %s", err)
		return err
	}

	if err := os.WriteFile(WiFiPasswd, []byte(password), 0o644); err != nil {
		log.Errorf("failed to save wifi password: %s", err)
		return err
	}

	if err := os.WriteFile(WiFiConnect, nil, 0o644); err != nil {
		log.Errorf("failed to connect wifi: %s", err)
		return err
	}

	return nil
}

func isSupported() bool {
	_, err := os.Stat(WiFiExistFile)
	return err == nil
}

func isAPMode() bool {
	_, err := os.Stat(WiFiApModeFile)
	return err == nil
}

func isConnected() bool {
	content, err := os.ReadFile(WiFiStateFile)
	if err != nil {
		return false
	}

	state := strings.ReplaceAll(string(content), "\n", "")
	return state == "1"
}

func getWiFiSsid() string {
	ssidByte, err := os.ReadFile(WiFiSSID)
	if err != nil {
		return ""
	}

	return strings.ReplaceAll(string(ssidByte), "\n", "")
}

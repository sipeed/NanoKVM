package network

import (
	"crypto/subtle"
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
	WiFiExistFile         = "/etc/kvm/wifi_exist"
	WiFiApModeFile        = "/tmp/wifiap"
	WiFiSSID              = "/etc/kvm/wifi.ssid"
	WiFiPasswd            = "/etc/kvm/wifi.pass"
	WiFiMode              = "/etc/kvm/wifi.mode"
	WiFiIdentity          = "/etc/kvm/wifi.identity"
	WiFiEAP               = "/etc/kvm/wifi.eap"
	WiFiPhase2            = "/etc/kvm/wifi.phase2"
	WiFiAnonymousIdentity = "/etc/kvm/wifi.anonymous_identity"
	WiFiCACert            = "/etc/kvm/wifi.ca_cert"
	WiFiDomainSuffixMatch = "/etc/kvm/wifi.domain_suffix_match"
	WiFiConnect           = "/kvmapp/kvm/wifi_try_connect"
	WiFiStateFile         = "/kvmapp/kvm/wifi_state"
	WiFiScript            = "/etc/init.d/S30wifi"
	WiFiApPassFile        = "/kvmapp/kvm/ap.pass"
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

	// Verify AP Password
	apKey := c.GetHeader("X-AP-Key")
	expectedPass := getApPassword()
	if apKey == "" || expectedPass == "" || subtle.ConstantTimeCompare([]byte(apKey), []byte(expectedPass)) != 1 {
		time.Sleep(2 * time.Second)
		rsp.ErrRsp(c, -4, "unauthorized")
		return
	}

	if err := parseConnectWifiRequest(c, &req); err != nil {
		time.Sleep(1 * time.Second)
		rsp.ErrRsp(c, -2, "invalid parameters")
		return
	}

	if err := connect(req); err != nil {
		rsp.ErrRsp(c, -3, "failed to connect wifi")
		return
	}

	time.Sleep(5 * time.Second)

	rsp.OkRsp(c)
	log.Debugf("set wifi ap mode successfully")
}

func (s *Service) VerifyApLogin(c *gin.Context) {
	var rsp proto.Response

	if !isSupported() || !isAPMode() {
		time.Sleep(2 * time.Second)
		rsp.ErrRsp(c, -1, "invalid mode")
		return
	}

	apKey := c.GetHeader("X-AP-Key")
	expectedPass := getApPassword()
	if apKey == "" || expectedPass == "" || subtle.ConstantTimeCompare([]byte(apKey), []byte(expectedPass)) != 1 {
		time.Sleep(2 * time.Second)
		rsp.ErrRsp(c, -4, "unauthorized")
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) ConnectWifi(c *gin.Context) {
	var req proto.ConnectWifiReq
	var rsp proto.Response

	if err := parseConnectWifiRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if err := connect(req); err != nil {
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
	removeEnterpriseWiFiFiles()

	rsp.OkRsp(c)
	log.Debugf("stop wifi successfully")
}

func parseConnectWifiRequest(c *gin.Context, req *proto.ConnectWifiReq) error {
	if err := c.ShouldBind(req); err != nil {
		log.Errorf("parse wifi request failed, err: %s", err)
		return err
	}

	req.Ssid = strings.TrimSpace(req.Ssid)
	req.Mode = normalizeWiFiMode(req.Mode)
	req.EAP = strings.TrimSpace(req.EAP)
	req.Phase2 = strings.TrimSpace(req.Phase2)
	req.Identity = strings.TrimSpace(req.Identity)
	req.AnonymousIdentity = strings.TrimSpace(req.AnonymousIdentity)
	req.CACert = strings.TrimSpace(req.CACert)
	req.DomainSuffixMatch = strings.TrimSpace(req.DomainSuffixMatch)

	if req.Ssid == "" || req.Password == "" {
		return fmt.Errorf("ssid and password are required")
	}
	if isEnterpriseWiFiMode(req.Mode) && req.Identity == "" {
		return fmt.Errorf("identity is required for enterprise wifi")
	}
	if hasLineBreak(req.Ssid, req.Password, req.Identity, req.EAP, req.Phase2, req.AnonymousIdentity, req.CACert, req.DomainSuffixMatch) {
		return fmt.Errorf("wifi parameters must not contain line breaks")
	}

	if req.EAP == "" {
		req.EAP = "PEAP"
	}
	if req.Phase2 == "" {
		req.Phase2 = "auth=MSCHAPV2"
	}

	log.Debugf("wifi connect request: ssid=%q mode=%q identity_set=%t", req.Ssid, req.Mode, req.Identity != "")
	return nil
}

func normalizeWiFiMode(mode string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode == "" {
		return "psk"
	}
	return mode
}

func isEnterpriseWiFiMode(mode string) bool {
	return mode == "enterprise" || mode == "8021x" || mode == "wpa-eap"
}

func hasLineBreak(values ...string) bool {
	for _, value := range values {
		if strings.ContainsAny(value, "\r\n") {
			return true
		}
	}
	return false
}

func connect(req proto.ConnectWifiReq) error {
	if err := os.WriteFile(WiFiSSID, []byte(req.Ssid), 0o644); err != nil {
		log.Errorf("failed to save wifi ssid: %s", err)
		return err
	}

	if err := os.WriteFile(WiFiPasswd, []byte(req.Password), 0o600); err != nil {
		log.Errorf("failed to save wifi password: %s", err)
		return err
	}

	if err := os.WriteFile(WiFiMode, []byte(req.Mode), 0o644); err != nil {
		log.Errorf("failed to save wifi mode: %s", err)
		return err
	}

	if isEnterpriseWiFiMode(req.Mode) {
		if err := writeEnterpriseWiFiFiles(req); err != nil {
			return err
		}
	} else {
		removeEnterpriseWiFiFiles()
	}

	if err := os.WriteFile(WiFiConnect, nil, 0o644); err != nil {
		log.Errorf("failed to connect wifi: %s", err)
		return err
	}

	return nil
}

func writeEnterpriseWiFiFiles(req proto.ConnectWifiReq) error {
	files := map[string]string{
		WiFiIdentity:          req.Identity,
		WiFiEAP:               req.EAP,
		WiFiPhase2:            req.Phase2,
		WiFiAnonymousIdentity: req.AnonymousIdentity,
		WiFiCACert:            req.CACert,
		WiFiDomainSuffixMatch: req.DomainSuffixMatch,
	}

	for path, value := range files {
		if strings.TrimSpace(value) == "" {
			_ = os.Remove(path)
			continue
		}
		if err := os.WriteFile(path, []byte(value), 0o600); err != nil {
			log.Errorf("failed to save enterprise wifi file %s: %s", path, err)
			return err
		}
	}

	return nil
}

func removeEnterpriseWiFiFiles() {
	for _, path := range []string{
		WiFiMode,
		WiFiIdentity,
		WiFiEAP,
		WiFiPhase2,
		WiFiAnonymousIdentity,
		WiFiCACert,
		WiFiDomainSuffixMatch,
	} {
		_ = os.Remove(path)
	}
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

func getApPassword() string {
	passByte, err := os.ReadFile(WiFiApPassFile)
	if err != nil {
		return ""
	}

	return strings.ReplaceAll(string(passByte), "\n", "")
}

package network

import (
	"crypto/subtle"
	"fmt"
	"net"
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
	WiFiIPModeDHCP        = "dhcp"
	WiFiIPModeManual      = "manual"
	WiFiSSID              = "/etc/kvm/wifi.ssid"
	WiFiPasswd            = "/etc/kvm/wifi.pass"
	WiFiMode              = "/etc/kvm/wifi.mode"
	WiFiIdentity          = "/etc/kvm/wifi.identity"
	WiFiEAP               = "/etc/kvm/wifi.eap"
	WiFiPhase2            = "/etc/kvm/wifi.phase2"
	WiFiAnonymousIdentity = "/etc/kvm/wifi.anonymous_identity"
	WiFiCACert            = "/etc/kvm/wifi.ca_cert"
	WiFiClientCert        = "/etc/kvm/wifi.client_cert"
	WiFiPrivateKey        = "/etc/kvm/wifi.private_key"
	WiFiPrivateKeyPasswd  = "/etc/kvm/wifi.private_key_passwd"
	WiFiDomainSuffixMatch = "/etc/kvm/wifi.domain_suffix_match"
	WiFiStaticConfig      = "/boot/wifi.nodhcp"
	WiFiConnect           = "/kvmapp/kvm/wifi_try_connect"
	WiFiStateFile         = "/kvmapp/kvm/wifi_state"
	WiFiScript            = "/etc/init.d/S30wifi"
	WiFiApPassFile        = "/kvmapp/kvm/ap.pass"
)

func (s *Service) GetWifi(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetWifiRsp{
		Supported:           isSupported(),
		ApMode:              isAPMode(),
		Connected:           isConnected(),
		Ssid:                readTrimmedFile(WiFiSSID),
		Mode:                currentWiFiMode(),
		IPMode:              currentWiFiIPMode(),
		Address:             readWiFiStaticAddress(),
		SubnetMask:          readWiFiStaticSubnetMask(),
		Gateway:             readWiFiStaticGateway(),
		PasswordSet:         fileExists(WiFiPasswd),
		Identity:            readTrimmedFile(WiFiIdentity),
		EAP:                 readTrimmedFile(WiFiEAP),
		Phase2:              readTrimmedFile(WiFiPhase2),
		AnonymousIdentity:   readTrimmedFile(WiFiAnonymousIdentity),
		CACert:              readTrimmedFile(WiFiCACert),
		ClientCert:          readTrimmedFile(WiFiClientCert),
		PrivateKey:          readTrimmedFile(WiFiPrivateKey),
		PrivateKeyPasswdSet: fileExists(WiFiPrivateKeyPasswd),
		DomainSuffixMatch:   readTrimmedFile(WiFiDomainSuffixMatch),
	}

	if !data.Supported {
		rsp.OkRspWithData(c, data)
		return
	}

	if data.Connected && data.Ssid == "" {
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

	_ = os.Remove(WiFiStaticConfig)
	_ = os.Remove(WiFiSSID)
	_ = os.Remove(WiFiPasswd)
	_ = os.Remove(WiFiMode)
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
	req.IPMode = normalizeWiFiIPMode(req.IPMode)
	req.Address = strings.TrimSpace(req.Address)
	req.SubnetMask = strings.TrimSpace(req.SubnetMask)
	req.Gateway = strings.TrimSpace(req.Gateway)
	req.EAP = strings.TrimSpace(req.EAP)
	req.Phase2 = strings.TrimSpace(req.Phase2)
	req.Identity = strings.TrimSpace(req.Identity)
	req.AnonymousIdentity = strings.TrimSpace(req.AnonymousIdentity)
	req.CACert = strings.TrimSpace(req.CACert)
	req.ClientCert = strings.TrimSpace(req.ClientCert)
	req.PrivateKey = strings.TrimSpace(req.PrivateKey)
	req.PrivateKeyPasswd = strings.TrimSpace(req.PrivateKeyPasswd)
	req.DomainSuffixMatch = strings.TrimSpace(req.DomainSuffixMatch)

	if req.Ssid == "" {
		return fmt.Errorf("ssid is required")
	}
	if err := validateWiFiIPConfig(req.IPMode, req.Address, req.SubnetMask, req.Gateway); err != nil {
		return err
	}
	if !isEnterpriseWiFiMode(req.Mode) && req.Password == "" && !fileExists(WiFiPasswd) {
		return fmt.Errorf("password is required")
	}
	if hasLineBreak(req.Ssid, req.Password, req.Identity, req.EAP, req.Phase2, req.AnonymousIdentity, req.CACert, req.ClientCert, req.PrivateKey, req.PrivateKeyPasswd, req.DomainSuffixMatch, req.Address, req.SubnetMask, req.Gateway) {
		return fmt.Errorf("wifi parameters must not contain line breaks")
	}

	if req.EAP == "" {
		req.EAP = "PEAP"
	}
	req.EAP = strings.ToUpper(req.EAP)
	if !isSupportedEAP(req.EAP) {
		return fmt.Errorf("unsupported eap method")
	}
	if req.Phase2 == "" {
		req.Phase2 = defaultPhase2(req.EAP)
	}
	if req.EAP != "PEAP" && req.EAP != "TTLS" {
		req.Phase2 = ""
	}
	if req.EAP != "TLS" {
		req.ClientCert = ""
		req.PrivateKey = ""
		req.PrivateKeyPasswd = ""
	}

	if isEnterpriseWiFiMode(req.Mode) {
		if req.Identity == "" {
			return fmt.Errorf("identity is required for enterprise wifi")
		}
		if usesPassword(req.EAP) && req.Password == "" && !fileExists(WiFiPasswd) {
			return fmt.Errorf("password is required for %s", req.EAP)
		}
		if req.EAP == "TLS" && (req.ClientCert == "" || req.PrivateKey == "") {
			return fmt.Errorf("client certificate and private key are required for TLS")
		}
		if req.EAP == "TLS" {
			req.Password = ""
		}
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

func defaultPhase2(eap string) string {
	switch eap {
	case "PEAP", "TTLS":
		return "auth=MSCHAPV2"
	default:
		return ""
	}
}

func usesPassword(eap string) bool {
	return eap == "PEAP" || eap == "TTLS" || eap == "PWD" || eap == "LEAP"
}

func isSupportedEAP(eap string) bool {
	return eap == "PEAP" || eap == "TTLS" || eap == "TLS" || eap == "PWD" || eap == "LEAP"
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
	if err := saveWiFiIPConfig(req.IPMode, req.Address, req.SubnetMask, req.Gateway); err != nil {
		return err
	}

	if err := os.WriteFile(WiFiSSID, []byte(req.Ssid), 0o644); err != nil {
		log.Errorf("failed to save wifi ssid: %s", err)
		return err
	}

	if strings.TrimSpace(req.Password) != "" {
		if err := os.WriteFile(WiFiPasswd, []byte(req.Password), 0o600); err != nil {
			log.Errorf("failed to save wifi password: %s", err)
			return err
		}
	} else if !fileExists(WiFiPasswd) {
		return fmt.Errorf("missing existing wifi password")
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

func normalizeWiFiIPMode(mode string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode == WiFiIPModeManual {
		return WiFiIPModeManual
	}
	return WiFiIPModeDHCP
}

func currentWiFiMode() string {
	mode := readTrimmedFile(WiFiMode)
	if isEnterpriseWiFiMode(mode) {
		return "enterprise"
	}
	return "psk"
}

func validateWiFiIPConfig(mode, address, subnetMask, gateway string) error {
	if mode != WiFiIPModeManual {
		return nil
	}
	if address == "" {
		return fmt.Errorf("static wifi address is required")
	}
	ip := net.ParseIP(address)
	if ip == nil || ip.To4() == nil {
		return fmt.Errorf("invalid static wifi address")
	}
	if subnetMask == "" {
		return fmt.Errorf("static wifi subnet mask is required")
	}
	if _, err := subnetMaskToPrefix(subnetMask); err != nil {
		return fmt.Errorf("invalid static wifi subnet")
	}
	if gateway != "" {
		gwIP := net.ParseIP(gateway)
		if gwIP == nil || gwIP.To4() == nil {
			return fmt.Errorf("invalid static wifi gateway")
		}
	}
	return nil
}

func currentWiFiIPMode() string {
	if fileExists(WiFiStaticConfig) {
		return WiFiIPModeManual
	}
	return WiFiIPModeDHCP
}

func saveWiFiIPConfig(mode, address, subnetMask, gateway string) error {
	if mode != WiFiIPModeManual {
		if err := os.Remove(WiFiStaticConfig); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to remove wifi static config: %w", err)
		}
		return nil
	}

	prefix, err := subnetMaskToPrefix(subnetMask)
	if err != nil {
		return fmt.Errorf("failed to parse wifi subnet mask: %w", err)
	}

	line := fmt.Sprintf("%s/%d", address, prefix)
	if gateway != "" {
		line += " " + gateway
	}
	line += "\n"
	if err := os.WriteFile(WiFiStaticConfig, []byte(line), 0o644); err != nil {
		return fmt.Errorf("failed to write wifi static config: %w", err)
	}
	return nil
}

func readWiFiStaticAddress() string {
	address, _, _ := parseWiFiStaticConfig()
	return address
}

func readWiFiStaticSubnetMask() string {
	_, subnetMask, _ := parseWiFiStaticConfig()
	return subnetMask
}

func readWiFiStaticGateway() string {
	_, _, gateway := parseWiFiStaticConfig()
	return gateway
}

func parseWiFiStaticConfig() (string, string, string) {
	data, err := os.ReadFile(WiFiStaticConfig)
	if err != nil {
		return "", "", ""
	}
	fields := strings.Fields(string(data))
	if len(fields) == 0 {
		return "", "", ""
	}
	address := strings.TrimSpace(fields[0])
	subnetMask := ""
	gateway := ""

	if strings.Contains(address, "/") {
		if ip, ipNet, err := net.ParseCIDR(address); err == nil && ip != nil && ip.To4() != nil {
			address = ip.String()
			subnetMask = net.IP(ipNet.Mask).String()
		}
		if len(fields) > 1 {
			gateway = strings.TrimSpace(fields[1])
		}
		return address, subnetMask, gateway
	}

	if len(fields) > 1 {
		second := strings.TrimSpace(fields[1])
		if isValidSubnetMask(second) {
			subnetMask = second
			if len(fields) > 2 {
				gateway = strings.TrimSpace(fields[2])
			}
		} else {
			gateway = second
		}
	}

	return address, subnetMask, gateway
}

func writeEnterpriseWiFiFiles(req proto.ConnectWifiReq) error {
	files := map[string]string{
		WiFiIdentity:          req.Identity,
		WiFiEAP:               req.EAP,
		WiFiPhase2:            req.Phase2,
		WiFiAnonymousIdentity: req.AnonymousIdentity,
		WiFiCACert:            req.CACert,
		WiFiClientCert:        req.ClientCert,
		WiFiPrivateKey:        req.PrivateKey,
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

	if strings.TrimSpace(req.PrivateKeyPasswd) != "" {
		if err := os.WriteFile(WiFiPrivateKeyPasswd, []byte(req.PrivateKeyPasswd), 0o600); err != nil {
			log.Errorf("failed to save enterprise wifi file %s: %s", WiFiPrivateKeyPasswd, err)
			return err
		}
	} else if req.EAP != "TLS" {
		_ = os.Remove(WiFiPrivateKeyPasswd)
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
		WiFiClientCert,
		WiFiPrivateKey,
		WiFiPrivateKeyPasswd,
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

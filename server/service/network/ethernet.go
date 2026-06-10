package network

import (
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
	ethernetIface             = "eth0"
	ethernetModeOff           = "off"
	ethernetIPModeDHCP        = "dhcp"
	ethernetIPModeManual      = "manual"
	EthernetMode              = "/etc/kvm/eth.mode"
	EthernetPasswd            = "/etc/kvm/eth.pass"
	EthernetIdentity          = "/etc/kvm/eth.identity"
	EthernetEAP               = "/etc/kvm/eth.eap"
	EthernetPhase2            = "/etc/kvm/eth.phase2"
	EthernetAnonymousIdentity = "/etc/kvm/eth.anonymous_identity"
	EthernetCACert            = "/etc/kvm/eth.ca_cert"
	EthernetClientCert        = "/etc/kvm/eth.client_cert"
	EthernetPrivateKey        = "/etc/kvm/eth.private_key"
	EthernetPrivateKeyPasswd  = "/etc/kvm/eth.private_key_passwd"
	EthernetDomainSuffixMatch = "/etc/kvm/eth.domain_suffix_match"
	EthernetStaticConfig      = "/boot/eth.nodhcp"
	EthernetScript            = "/etc/init.d/S30eth"
)

func (s *Service) GetEthernet(c *gin.Context) {
	var rsp proto.Response

	mode := currentEthernetMode()

	rsp.OkRspWithData(c, &proto.GetEthernetRsp{
		Supported:           supportsWired8021X(),
		Mode:                mode,
		Configured:          mode == "enterprise",
		Connected:           isEthernetConnected(),
		Interface:           ethernetIface,
		IPMode:              currentEthernetIPMode(),
		Address:             readEthernetStaticAddress(),
		SubnetMask:          readEthernetStaticSubnetMask(),
		Gateway:             readEthernetStaticGateway(),
		PasswordSet:         fileExists(EthernetPasswd),
		Identity:            readTrimmedFile(EthernetIdentity),
		EAP:                 readTrimmedFile(EthernetEAP),
		Phase2:              readTrimmedFile(EthernetPhase2),
		AnonymousIdentity:   readTrimmedFile(EthernetAnonymousIdentity),
		CACert:              readTrimmedFile(EthernetCACert),
		ClientCert:          readTrimmedFile(EthernetClientCert),
		PrivateKey:          readTrimmedFile(EthernetPrivateKey),
		PrivateKeyPasswdSet: fileExists(EthernetPrivateKeyPasswd),
		DomainSuffixMatch:   readTrimmedFile(EthernetDomainSuffixMatch),
	})
}

func (s *Service) SetEthernet(c *gin.Context) {
	var req proto.SetEthernetReq
	var rsp proto.Response

	if err := parseEthernetRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if err := setEthernet(req); err != nil {
		rsp.ErrRsp(c, -2, "failed to configure ethernet")
		return
	}

	time.Sleep(5 * time.Second)

	rsp.OkRsp(c)
	log.Debugf("set ethernet config: mode=%q identity_set=%t eap=%q", req.Mode, req.Identity != "", req.EAP)
}

func parseEthernetRequest(c *gin.Context, req *proto.SetEthernetReq) error {
	if err := c.ShouldBind(req); err != nil {
		log.Errorf("parse ethernet request failed, err: %s", err)
		return err
	}

	req.Mode = normalizeEthernetMode(req.Mode)
	req.IPMode = normalizeEthernetIPMode(req.IPMode)
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
	if err := validateEthernetIPConfig(req.IPMode, req.Address, req.SubnetMask, req.Gateway); err != nil {
		return err
	}

	if !isEnterpriseWiFiMode(req.Mode) {
		req.Mode = ethernetModeOff
		req.IPMode = normalizeEthernetIPMode(req.IPMode)
		req.Password = ""
		req.Identity = ""
		req.EAP = ""
		req.Phase2 = ""
		req.AnonymousIdentity = ""
		req.CACert = ""
		req.ClientCert = ""
		req.PrivateKey = ""
		req.PrivateKeyPasswd = ""
		req.DomainSuffixMatch = ""
		return nil
	}

	if hasLineBreak(req.Password, req.Identity, req.EAP, req.Phase2, req.AnonymousIdentity, req.CACert, req.ClientCert, req.PrivateKey, req.PrivateKeyPasswd, req.DomainSuffixMatch, req.Address, req.SubnetMask, req.Gateway) {
		return fmt.Errorf("ethernet parameters must not contain line breaks")
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
	if req.Identity == "" {
		return fmt.Errorf("identity is required for enterprise ethernet")
	}
	if usesPassword(req.EAP) && req.Password == "" && !fileExists(EthernetPasswd) {
		return fmt.Errorf("password is required for %s", req.EAP)
	}
	if req.EAP == "TLS" && (req.ClientCert == "" || req.PrivateKey == "") {
		return fmt.Errorf("client certificate and private key are required for TLS")
	}
	if req.EAP == "TLS" {
		req.Password = ""
	}

	return nil
}

func setEthernet(req proto.SetEthernetReq) error {
	if err := saveEthernetIPConfig(req.IPMode, req.Address, req.SubnetMask, req.Gateway); err != nil {
		return err
	}

	if req.Mode == ethernetModeOff {
		_ = os.Remove(EthernetPasswd)
		removeEnterpriseEthernetFiles()
		return restartEthernet()
	}

	if strings.TrimSpace(req.Password) != "" {
		if err := os.WriteFile(EthernetPasswd, []byte(req.Password), 0o600); err != nil {
			log.Errorf("failed to save ethernet password: %s", err)
			return err
		}
	} else if usesPassword(req.EAP) && !fileExists(EthernetPasswd) {
		return fmt.Errorf("missing existing ethernet password")
	}
	if err := os.WriteFile(EthernetMode, []byte(req.Mode), 0o644); err != nil {
		log.Errorf("failed to save ethernet mode: %s", err)
		return err
	}
	if err := writeEnterpriseEthernetFiles(req); err != nil {
		return err
	}

	return restartEthernet()
}

func writeEnterpriseEthernetFiles(req proto.SetEthernetReq) error {
	files := map[string]string{
		EthernetIdentity:          req.Identity,
		EthernetEAP:               req.EAP,
		EthernetPhase2:            req.Phase2,
		EthernetAnonymousIdentity: req.AnonymousIdentity,
		EthernetCACert:            req.CACert,
		EthernetClientCert:        req.ClientCert,
		EthernetPrivateKey:        req.PrivateKey,
		EthernetDomainSuffixMatch: req.DomainSuffixMatch,
	}

	for path, value := range files {
		if strings.TrimSpace(value) == "" {
			_ = os.Remove(path)
			continue
		}
		if err := os.WriteFile(path, []byte(value), 0o600); err != nil {
			log.Errorf("failed to save enterprise ethernet file %s: %s", path, err)
			return err
		}
	}

	if strings.TrimSpace(req.PrivateKeyPasswd) != "" {
		if err := os.WriteFile(EthernetPrivateKeyPasswd, []byte(req.PrivateKeyPasswd), 0o600); err != nil {
			log.Errorf("failed to save enterprise ethernet file %s: %s", EthernetPrivateKeyPasswd, err)
			return err
		}
	} else if req.EAP != "TLS" {
		_ = os.Remove(EthernetPrivateKeyPasswd)
	}

	return nil
}

func removeEnterpriseEthernetFiles() {
	for _, path := range []string{
		EthernetMode,
		EthernetIdentity,
		EthernetEAP,
		EthernetPhase2,
		EthernetAnonymousIdentity,
		EthernetCACert,
		EthernetClientCert,
		EthernetPrivateKey,
		EthernetPrivateKeyPasswd,
		EthernetDomainSuffixMatch,
	} {
		_ = os.Remove(path)
	}
}

func restartEthernet() error {
	cmd := exec.Command(EthernetScript, "restart")
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Errorf("failed to restart ethernet: %s", output)
		return err
	}

	return nil
}

func normalizeEthernetMode(mode string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode == "" {
		return ethernetModeOff
	}
	return mode
}

func normalizeEthernetIPMode(mode string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode == ethernetIPModeManual {
		return ethernetIPModeManual
	}
	return ethernetIPModeDHCP
}

func currentEthernetMode() string {
	data, err := os.ReadFile(EthernetMode)
	if err != nil {
		return ethernetModeOff
	}

	mode := strings.TrimSpace(string(data))
	if !isEnterpriseWiFiMode(mode) {
		return ethernetModeOff
	}

	return mode
}

func readTrimmedFile(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}

	return strings.TrimSpace(string(data))
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func validateEthernetIPConfig(mode, address, subnetMask, gateway string) error {
	if mode != ethernetIPModeManual {
		return nil
	}
	if address == "" {
		return fmt.Errorf("static ethernet address is required")
	}
	ip := net.ParseIP(address)
	if ip == nil || ip.To4() == nil {
		return fmt.Errorf("invalid static ethernet address")
	}
	if subnetMask == "" {
		return fmt.Errorf("static ethernet subnet mask is required")
	}
	ones, err := subnetMaskToPrefix(subnetMask)
	if err != nil || ones < 1 || ones > 32 {
		return fmt.Errorf("invalid static ethernet subnet")
	}
	if gateway != "" {
		gwIP := net.ParseIP(gateway)
		if gwIP == nil || gwIP.To4() == nil {
			return fmt.Errorf("invalid static ethernet gateway")
		}
	}
	return nil
}

func currentEthernetIPMode() string {
	if fileExists(EthernetStaticConfig) {
		return ethernetIPModeManual
	}
	return ethernetIPModeDHCP
}

func saveEthernetIPConfig(mode, address, subnetMask, gateway string) error {
	if mode != ethernetIPModeManual {
		if err := os.Remove(EthernetStaticConfig); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to remove ethernet static config: %w", err)
		}
		return nil
	}

	prefix, err := subnetMaskToPrefix(subnetMask)
	if err != nil {
		return fmt.Errorf("failed to parse ethernet subnet mask: %w", err)
	}

	line := fmt.Sprintf("%s/%d", address, prefix)
	if gateway != "" {
		line += " " + gateway
	}
	line += "\n"
	if err := os.WriteFile(EthernetStaticConfig, []byte(line), 0o644); err != nil {
		return fmt.Errorf("failed to write ethernet static config: %w", err)
	}
	return nil
}

func readEthernetStaticAddress() string {
	address, _, _ := parseEthernetStaticConfig()
	return address
}

func readEthernetStaticSubnetMask() string {
	_, subnetMask, _ := parseEthernetStaticConfig()
	return subnetMask
}

func readEthernetStaticGateway() string {
	_, _, gateway := parseEthernetStaticConfig()
	return gateway
}

func parseEthernetStaticConfig() (string, string, string) {
	data, err := os.ReadFile(EthernetStaticConfig)
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

func subnetMaskToPrefix(mask string) (int, error) {
	ip := net.ParseIP(strings.TrimSpace(mask))
	if ip == nil || ip.To4() == nil {
		return 0, fmt.Errorf("invalid subnet mask")
	}

	ones, bits := net.IPMask(ip.To4()).Size()
	if bits != 32 || ones < 1 || ones > 32 {
		return 0, fmt.Errorf("invalid subnet mask")
	}

	return ones, nil
}

func isValidSubnetMask(mask string) bool {
	_, err := subnetMaskToPrefix(mask)
	return err == nil
}

func supportsWired8021X() bool {
	if _, err := os.Stat("/usr/sbin/wpa_supplicant-wired"); err == nil {
		return true
	}

	out, err := exec.Command("sh", "-c", "wpa_supplicant -h 2>&1").CombinedOutput()
	if err != nil {
		return false
	}

	return strings.Contains(string(out), "wired = Wired Ethernet driver")
}

func isEthernetConnected() bool {
	iface, err := net.InterfaceByName(ethernetIface)
	if err != nil {
		return false
	}
	if iface.Flags&net.FlagUp == 0 {
		return false
	}

	addrs, err := iface.Addrs()
	if err != nil {
		return false
	}

	for _, addr := range addrs {
		ipNet, ok := addr.(*net.IPNet)
		if !ok || ipNet.IP == nil || ipNet.IP.IsLoopback() {
			continue
		}
		if ipNet.IP.To4() != nil {
			return true
		}
	}

	return false
}

package network

import (
	"bufio"
	_ "embed"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	dnsModeManual = "manual"
	dnsModeDHCP   = "dhcp"

	dnsConfigDir     = "/etc/kvm/network"
	dnsModeFile      = "/etc/kvm/network/dns.mode"
	dnsServersFile   = "/etc/kvm/network/dns.servers"
	bootResolvFile   = "/boot/resolv.conf"
	bootResolvBackup = "/boot/resolv.conf.manual.bak"
	etcResolvFile    = "/etc/resolv.conf"
	dhcpResolvFile   = "/etc/resolv.conf.dhcp"
	udhcpcHookFile   = "/usr/share/udhcpc/default.script.d/99-nanokvm-dns"

	maxDNSServers = 6
)

//go:embed scripts/99-nanokvm-dns
var udhcpcDNSHook string

type resolvConfig struct {
	Servers       []string
	SearchDomains []string
}

func (s *Service) GetDNS(c *gin.Context) {
	var rsp proto.Response

	mode := currentDNSMode()

	servers := readManualDNSServers()
	if len(servers) == 0 {
		servers, _ = parseResolvConf(bootResolvFile)
	}
	if len(servers) == 0 {
		servers, _ = parseResolvConf(bootResolvBackup)
	}

	effective, _ := parseResolvConf(etcResolvFile)
	dhcpConfig, _ := readDHCPResolvConfig(mode == dnsModeDHCP)
	dhcp := dhcpConfig.Servers
	info := getDNSInfo()

	rsp.OkRspWithData(c, &proto.GetDNSRsp{
		Mode:      mode,
		Servers:   servers,
		Effective: effective,
		DHCP:      dhcp,
		Info:      info,
	})
	log.Debugf("get dns config: mode=%s servers=%v effective=%v dhcp=%v info=%+v", mode, servers, effective, dhcp, info)
}

func (s *Service) SetDNS(c *gin.Context) {
	var req proto.SetDNSReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	switch req.Mode {
	case dnsModeManual:
		if err := setManualDNS(req.Servers); err != nil {
			log.Errorf("failed to set manual dns: %s", err)
			rsp.ErrRsp(c, -2, err.Error())
			return
		}
	case dnsModeDHCP:
		if err := setDHCPDNS(); err != nil {
			log.Errorf("failed to set dhcp dns: %s", err)
			rsp.ErrRsp(c, -3, err.Error())
			return
		}
	default:
		rsp.ErrRsp(c, -1, "invalid dns mode")
		return
	}

	_ = exec.Command("sync").Run()

	rsp.OkRsp(c)
	log.Debugf("set dns config: mode=%s servers=%v", req.Mode, req.Servers)
}

func setManualDNS(servers []string) error {
	normalized, err := validateDNSServers(servers)
	if err != nil {
		return err
	}
	if len(normalized) == 0 {
		return fmt.Errorf("dns servers are required")
	}

	if currentDNSMode() == dnsModeDHCP {
		if err := refreshDHCPResolvCacheFromEffective(); err != nil {
			log.Warnf("failed to refresh dhcp dns cache before switching to manual: %s", err)
		}
	}

	if err := os.MkdirAll(dnsConfigDir, 0o755); err != nil {
		return fmt.Errorf("failed to create dns config directory: %w", err)
	}

	if err := writeDNSMode(dnsModeManual); err != nil {
		return err
	}

	if err := os.WriteFile(dnsServersFile, []byte(strings.Join(normalized, "\n")+"\n"), 0o644); err != nil {
		return fmt.Errorf("failed to write dns servers: %w", err)
	}

	if err := renderResolvConf(bootResolvFile, normalized); err != nil {
		return err
	}

	if err := renderResolvConf(etcResolvFile, normalized); err != nil {
		return err
	}

	return installUDHCPCDNSHook()
}

func setDHCPDNS() error {
	dhcpConfig, err := readDHCPResolvConfig(currentDNSMode() == dnsModeDHCP)
	if err != nil {
		return fmt.Errorf("failed to read dhcp dns: %w", err)
	}
	if len(dhcpConfig.Servers) == 0 {
		return fmt.Errorf("no dhcp dns is currently available")
	}

	if err := os.MkdirAll(dnsConfigDir, 0o755); err != nil {
		return fmt.Errorf("failed to create dns config directory: %w", err)
	}

	if err := renderResolvConfig(dhcpResolvFile, dhcpConfig); err != nil {
		return fmt.Errorf("failed to write dhcp dns cache: %w", err)
	}

	if err := writeDNSMode(dnsModeDHCP); err != nil {
		return err
	}

	if err := preserveManualDNSServers(); err != nil {
		return err
	}

	if err := backupAndRemoveBootResolv(); err != nil {
		return err
	}

	if err := renderResolvConfig(etcResolvFile, dhcpConfig); err != nil {
		return err
	}

	return installUDHCPCDNSHook()
}

func currentDNSMode() string {
	mode := readDNSMode()
	if mode == "" {
		mode = defaultDNSMode()
	}

	return mode
}

func readDNSMode() string {
	data, err := os.ReadFile(dnsModeFile)
	if err != nil {
		return ""
	}

	mode := strings.TrimSpace(string(data))
	if mode != dnsModeManual && mode != dnsModeDHCP {
		return ""
	}

	return mode
}

func defaultDNSMode() string {
	if _, err := os.Stat(bootResolvFile); err == nil {
		return dnsModeManual
	}

	return dnsModeDHCP
}

func writeDNSMode(mode string) error {
	if err := os.WriteFile(dnsModeFile, []byte(mode+"\n"), 0o644); err != nil {
		return fmt.Errorf("failed to write dns mode: %w", err)
	}

	return nil
}

func readManualDNSServers() []string {
	servers, err := parsePlainDNSServers(dnsServersFile)
	if err != nil {
		return nil
	}

	return servers
}

func preserveManualDNSServers() error {
	if len(readManualDNSServers()) > 0 {
		return nil
	}

	servers, _ := parseResolvConf(bootResolvFile)
	if len(servers) == 0 {
		servers, _ = parseResolvConf(bootResolvBackup)
	}
	if len(servers) == 0 {
		return nil
	}

	if err := os.WriteFile(dnsServersFile, []byte(strings.Join(servers, "\n")+"\n"), 0o644); err != nil {
		return fmt.Errorf("failed to preserve manual dns servers: %w", err)
	}

	return nil
}

func parsePlainDNSServers(path string) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(data), "\n")
	return normalizeDNSServers(lines)
}

func readDHCPResolvConfig(allowEffectiveFallback bool) (resolvConfig, error) {
	config, err := parseResolvConfig(dhcpResolvFile)
	if err == nil && len(config.Servers) > 0 {
		return config, nil
	}

	if allowEffectiveFallback {
		effective, effectiveErr := parseResolvConfig(etcResolvFile)
		if effectiveErr == nil && len(effective.Servers) > 0 {
			return effective, nil
		}
	}

	if err != nil && !os.IsNotExist(err) {
		return resolvConfig{}, err
	}

	return resolvConfig{}, nil
}

func refreshDHCPResolvCacheFromEffective() error {
	config, err := parseResolvConfig(etcResolvFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if len(config.Servers) == 0 {
		return nil
	}
	if len(config.SearchDomains) == 0 {
		cached, _ := parseResolvConfig(dhcpResolvFile)
		config.SearchDomains = cached.SearchDomains
	}

	return renderResolvConfig(dhcpResolvFile, config)
}

func parseResolvConf(path string) ([]string, error) {
	config, err := parseResolvConfig(path)
	if err != nil {
		return nil, err
	}

	return config.Servers, nil
}

func parseResolvConfig(path string) (resolvConfig, error) {
	file, err := os.Open(path)
	if err != nil {
		return resolvConfig{}, err
	}
	defer func() {
		_ = file.Close()
	}()

	var servers []string
	var searchDomains []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := stripInlineComment(scanner.Text())
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		switch fields[0] {
		case "nameserver":
			servers = append(servers, fields[1])
		case "search":
			searchDomains = append(searchDomains, fields[1:]...)
		case "domain":
			searchDomains = append(searchDomains, fields[1])
		}
	}

	if err := scanner.Err(); err != nil {
		return resolvConfig{}, err
	}

	normalizedServers, err := normalizeDNSServers(servers)
	if err != nil {
		return resolvConfig{}, err
	}

	return resolvConfig{
		Servers:       normalizedServers,
		SearchDomains: normalizeSearchDomains(searchDomains),
	}, nil
}

func getDNSInfo() proto.DNSInfo {
	ifaceName, gateway := getDefaultIPv4Route()
	if ifaceName == "" {
		ifaceName = getFallbackIPv4Interface()
	}

	info := proto.DNSInfo{
		Interface: ifaceName,
		Gateway:   gateway,
	}

	dhcpConfig, _ := readDHCPResolvConfig(currentDNSMode() == dnsModeDHCP)
	info.SearchDomains = dhcpConfig.SearchDomains

	if ifaceName == "" {
		return info
	}

	iface, err := net.InterfaceByName(ifaceName)
	if err != nil {
		return info
	}

	info.Type = getDNSInterfaceType(iface.Name)
	info.Address, info.SubnetMask = getIPv4AddressInfo(*iface)

	return info
}

func getDefaultIPv4Route() (string, string) {
	file, err := os.Open("/proc/net/route")
	if err != nil {
		return "", ""
	}
	defer func() {
		_ = file.Close()
	}()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 8 || fields[1] != "00000000" {
			continue
		}

		return fields[0], parseRouteGateway(fields[2])
	}

	return "", ""
}

func parseRouteGateway(value string) string {
	gateway, err := strconv.ParseUint(value, 16, 32)
	if err != nil || gateway == 0 {
		return ""
	}

	return net.IPv4(byte(gateway), byte(gateway>>8), byte(gateway>>16), byte(gateway>>24)).String()
}

func getFallbackIPv4Interface() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		if getDNSInterfaceType(iface.Name) == "" {
			continue
		}

		address, _ := getIPv4AddressInfo(iface)
		if address != "" {
			return iface.Name
		}
	}

	return ""
}

func getDNSInterfaceType(name string) string {
	if strings.HasPrefix(name, "eth") || strings.HasPrefix(name, "en") {
		return "Wired"
	}

	if strings.HasPrefix(name, "wlan") || strings.HasPrefix(name, "wl") {
		return "Wireless"
	}

	return ""
}

func getIPv4AddressInfo(iface net.Interface) (string, string) {
	addrs, err := iface.Addrs()
	if err != nil {
		return "", ""
	}

	for _, addr := range addrs {
		ipNet, ok := addr.(*net.IPNet)
		if !ok {
			continue
		}

		ip := ipNet.IP.To4()
		if ip == nil {
			continue
		}

		ones, _ := ipNet.Mask.Size()
		return fmt.Sprintf("%s/%d", ip.String(), ones), net.IP(ipNet.Mask).String()
	}

	return "", ""
}

func renderResolvConf(path string, servers []string) error {
	return renderResolvConfig(path, resolvConfig{Servers: servers})
}

func renderResolvConfig(path string, config resolvConfig) error {
	normalized, err := normalizeDNSServers(config.Servers)
	if err != nil {
		return err
	}
	if len(normalized) == 0 {
		return fmt.Errorf("dns servers are required")
	}

	var builder strings.Builder
	searchDomains := normalizeSearchDomains(config.SearchDomains)
	if len(searchDomains) > 0 {
		builder.WriteString("search ")
		builder.WriteString(strings.Join(searchDomains, " "))
		builder.WriteString("\n")
	}

	for _, server := range normalized {
		builder.WriteString("nameserver ")
		builder.WriteString(server)
		builder.WriteString("\n")
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("failed to create dns file directory: %w", err)
	}

	if err := os.WriteFile(path, []byte(builder.String()), 0o644); err != nil {
		return fmt.Errorf("failed to write %s: %w", path, err)
	}

	return nil
}

func validateDNSServers(servers []string) ([]string, error) {
	normalized, err := normalizeDNSServers(servers)
	if err != nil {
		return nil, err
	}
	if len(normalized) > maxDNSServers {
		return nil, fmt.Errorf("too many dns servers")
	}

	return normalized, nil
}

func normalizeDNSServers(servers []string) ([]string, error) {
	seen := make(map[string]struct{})
	var normalized []string

	for _, server := range servers {
		server = normalizeDNSServer(server)
		if server == "" {
			continue
		}

		ip := net.ParseIP(server)
		if ip == nil {
			return nil, fmt.Errorf("invalid dns server: %s", server)
		}

		server = ip.String()
		if _, exists := seen[server]; exists {
			continue
		}

		seen[server] = struct{}{}
		normalized = append(normalized, server)
	}

	return normalized, nil
}

func normalizeSearchDomains(domains []string) []string {
	seen := make(map[string]struct{})
	var normalized []string

	for _, domain := range domains {
		domain = strings.TrimSpace(domain)
		if domain == "" {
			continue
		}
		if _, exists := seen[domain]; exists {
			continue
		}

		seen[domain] = struct{}{}
		normalized = append(normalized, domain)
	}

	return normalized
}

func normalizeDNSServer(server string) string {
	server = stripInlineComment(server)
	server = strings.TrimSpace(server)
	fields := strings.Fields(server)
	if len(fields) == 0 {
		return ""
	}

	return fields[0]
}

func stripInlineComment(value string) string {
	if index := strings.Index(value, "#"); index >= 0 {
		return value[:index]
	}

	return value
}

func backupAndRemoveBootResolv() error {
	data, err := os.ReadFile(bootResolvFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("failed to read boot resolv: %w", err)
	}

	if err := os.WriteFile(bootResolvBackup, data, 0o644); err != nil {
		return fmt.Errorf("failed to backup boot resolv: %w", err)
	}

	if err := os.Remove(bootResolvFile); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove boot resolv: %w", err)
	}

	return nil
}

func installUDHCPCDNSHook() error {
	if err := os.MkdirAll(filepath.Dir(udhcpcHookFile), 0o755); err != nil {
		return fmt.Errorf("failed to create udhcpc hook directory: %w", err)
	}

	if err := os.WriteFile(udhcpcHookFile, []byte(udhcpcDNSHook), 0o755); err != nil {
		return fmt.Errorf("failed to install udhcpc dns hook: %w", err)
	}

	return nil
}

package network

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const (
	EthNoDhcpFile  = "/boot/eth.nodhcp"
	ResolvConfFile = "/etc/resolv.conf"
	EthConfigFile  = "/etc/kvm/ethernet.yaml"
	EthScript      = "/etc/init.d/S30eth"
)

func (s *Service) GetEthernetConfig(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetEthernetConfigRsp{}

	// 读取保存的配置
	data.Config = readSavedConfig()

	// 获取当前实际生效的配置
	data.Current = getCurrentConfig()

	rsp.OkRspWithData(c, data)
	log.Debugf("get ethernet config: %+v", data)
}

func (s *Service) SetEthernetConfig(c *gin.Context) {
	var req proto.SetEthernetConfigReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if req.DHCP {
		// 启用 DHCP：删除静态 IP 配置文件
		if err := os.Remove(EthNoDhcpFile); err != nil && !os.IsNotExist(err) {
			log.Errorf("failed to remove eth.nodhcp: %s", err)
			rsp.ErrRsp(c, -2, "failed to enable DHCP")
			return
		}

		// 保存配置到 /etc/kvm/ethernet.yaml
		config := proto.EthernetConfig{DHCP: true}
		if err := saveConfig(config); err != nil {
			log.Errorf("failed to save config: %s", err)
		}
	} else {
		// 静态 IP 模式：验证并保存配置
		if !isValidIP(req.IP) {
			rsp.ErrRsp(c, -3, "invalid IP address")
			return
		}
		if !isValidNetmask(req.Netmask) {
			rsp.ErrRsp(c, -4, "invalid netmask")
			return
		}
		if req.Gateway != "" && !isValidIP(req.Gateway) {
			rsp.ErrRsp(c, -5, "invalid gateway")
			return
		}

		// 将子网掩码转换为 CIDR
		cidr := netmaskToCIDR(req.Netmask)
		if cidr < 0 {
			rsp.ErrRsp(c, -6, "invalid netmask format")
			return
		}

		// 写入 /boot/eth.nodhcp
		ethContent := fmt.Sprintf("%s/%d %s\n", req.IP, cidr, req.Gateway)
		if err := os.WriteFile(EthNoDhcpFile, []byte(ethContent), 0o644); err != nil {
			log.Errorf("failed to write eth.nodhcp: %s", err)
			rsp.ErrRsp(c, -7, "failed to save static IP config")
			return
		}

		// 写入 DNS 到 /etc/resolv.conf
		if req.DNS1 != "" || req.DNS2 != "" {
			if err := writeDNSConfig(req.DNS1, req.DNS2); err != nil {
				log.Errorf("failed to write DNS config: %s", err)
			}
		}

		// 保存配置到 /etc/kvm/ethernet.yaml（升级后保留）
		config := proto.EthernetConfig{
			DHCP:    false,
			IP:      req.IP,
			Netmask: req.Netmask,
			Gateway: req.Gateway,
			DNS1:    req.DNS1,
			DNS2:    req.DNS2,
		}
		if err := saveConfig(config); err != nil {
			log.Errorf("failed to save config: %s", err)
		}
	}

	// 重启网络服务
	go func() {
		time.Sleep(500 * time.Millisecond)
		restartEthernet()
	}()

	rsp.OkRsp(c)
	log.Debugf("set ethernet config successfully")
}

func readSavedConfig() proto.EthernetConfig {
	config := proto.EthernetConfig{DHCP: true}

	data, err := os.ReadFile(EthConfigFile)
	if err != nil {
		// 没有保存的配置，检查是否存在 eth.nodhcp
		if _, err := os.Stat(EthNoDhcpFile); os.IsNotExist(err) {
			config.DHCP = true
		} else {
			config.DHCP = false
		}
		return config
	}

	if err := yaml.Unmarshal(data, &config); err != nil {
		log.Errorf("failed to parse ethernet config: %s", err)
		return proto.EthernetConfig{DHCP: true}
	}

	return config
}

func getCurrentConfig() proto.EthernetConfig {
	config := proto.EthernetConfig{}

	// 检查是否是 DHCP 模式
	if _, err := os.Stat(EthNoDhcpFile); os.IsNotExist(err) {
		config.DHCP = true
	} else {
		config.DHCP = false
	}

	// 获取当前 eth0 的 IP 地址
	iface, err := net.InterfaceByName("eth0")
	if err != nil {
		log.Errorf("failed to get eth0 interface: %s", err)
		return config
	}

	addrs, err := iface.Addrs()
	if err != nil {
		log.Errorf("failed to get eth0 addresses: %s", err)
		return config
	}

	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok {
			if ipNet.IP.To4() != nil {
				config.IP = ipNet.IP.String()
				config.Netmask = cidrToNetmask(maskSize(ipNet.Mask))
				break
			}
		}
	}

	// 获取网关
	config.Gateway = getDefaultGateway()

	// 获取 DNS
	config.DNS1, config.DNS2 = getDNSServers()

	return config
}

func saveConfig(config proto.EthernetConfig) error {
	data, err := yaml.Marshal(&config)
	if err != nil {
		return err
	}

	// 确保目录存在
	_ = os.MkdirAll("/etc/kvm", 0o755)

	return os.WriteFile(EthConfigFile, data, 0o644)
}

func writeDNSConfig(dns1, dns2 string) error {
	var content strings.Builder

	if dns1 != "" && isValidIP(dns1) {
		content.WriteString(fmt.Sprintf("nameserver %s\n", dns1))
	}
	if dns2 != "" && isValidIP(dns2) {
		content.WriteString(fmt.Sprintf("nameserver %s\n", dns2))
	}

	if content.Len() == 0 {
		return nil
	}

	return os.WriteFile(ResolvConfFile, []byte(content.String()), 0o644)
}

func restartEthernet() {
	// 先停止
	cmd := exec.Command("sh", "-c", fmt.Sprintf("%s stop", EthScript))
	_ = cmd.Run()

	time.Sleep(500 * time.Millisecond)

	// 再启动
	cmd = exec.Command("sh", "-c", fmt.Sprintf("%s start", EthScript))
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Errorf("failed to restart ethernet: %s, output: %s", err, output)
	} else {
		log.Debugf("ethernet restarted successfully")
	}
}

func getDefaultGateway() string {
	cmd := exec.Command("sh", "-c", "ip route | grep default | awk '{print $3}'")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func getDNSServers() (string, string) {
	file, err := os.Open(ResolvConfFile)
	if err != nil {
		return "", ""
	}
	defer file.Close()

	var dns1, dns2 string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "nameserver ") {
			server := strings.TrimPrefix(line, "nameserver ")
			server = strings.TrimSpace(server)
			if dns1 == "" {
				dns1 = server
			} else if dns2 == "" {
				dns2 = server
				break
			}
		}
	}

	return dns1, dns2
}

func isValidIP(ip string) bool {
	return net.ParseIP(ip) != nil
}

func isValidNetmask(netmask string) bool {
	parts := strings.Split(netmask, ".")
	if len(parts) != 4 {
		return false
	}

	for _, part := range parts {
		num, err := strconv.Atoi(part)
		if err != nil || num < 0 || num > 255 {
			return false
		}
	}

	// 验证是有效的子网掩码
	ip := net.ParseIP(netmask)
	if ip == nil {
		return false
	}

	mask := ip.To4()
	if mask == nil {
		return false
	}

	// 检查是否是连续的 1 后面跟着连续的 0
	bits := uint32(mask[0])<<24 | uint32(mask[1])<<16 | uint32(mask[2])<<8 | uint32(mask[3])
	inverted := ^bits
	return (inverted & (inverted + 1)) == 0
}

func netmaskToCIDR(netmask string) int {
	ip := net.ParseIP(netmask)
	if ip == nil {
		return -1
	}

	mask := ip.To4()
	if mask == nil {
		return -1
	}

	cidr := 0
	for _, b := range mask {
		for i := 7; i >= 0; i-- {
			if (b>>i)&1 == 1 {
				cidr++
			} else {
				return cidr
			}
		}
	}

	return cidr
}

func cidrToNetmask(cidr int) string {
	if cidr < 0 || cidr > 32 {
		return "255.255.255.0"
	}

	mask := uint32(0xFFFFFFFF) << (32 - cidr)
	return fmt.Sprintf("%d.%d.%d.%d",
		(mask>>24)&0xFF,
		(mask>>16)&0xFF,
		(mask>>8)&0xFF,
		mask&0xFF)
}

func maskSize(mask net.IPMask) int {
	ones, _ := mask.Size()
	return ones
}

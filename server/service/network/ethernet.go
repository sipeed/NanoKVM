package network

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"net/netip"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	ethernetModeDHCP   = "dhcp"
	ethernetModeStatic = "static"

	ethernetInterface  = "eth0"
	ethernetInitScript = "/etc/init.d/S30eth"
)

var ethernetConfigFile = "/boot/eth.nodhcp"

func (s *Service) GetEthernet(c *gin.Context) {
	var rsp proto.Response

	config, err := readEthernetConfig()
	if err != nil {
		log.Errorf("failed to read ethernet config: %s", err)
		rsp.ErrRsp(c, -1, "failed to read ethernet configuration")
		return
	}

	rsp.OkRspWithData(c, config)
}

func (s *Service) SetEthernet(c *gin.Context) {
	var req proto.SetEthernetReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	config := proto.EthernetConfig{Mode: req.Mode, Interface: ethernetInterface}
	if req.Mode == ethernetModeStatic {
		address, gateway, err := validateStaticEthernet(req.Address, req.SubnetMask, req.Gateway)
		if err != nil {
			rsp.ErrRsp(c, -1, err.Error())
			return
		}
		config.Address = address.Addr().String()
		config.SubnetMask = address.Bits()
		config.Gateway = gateway.String()
	}

	if err := writeEthernetConfig(config); err != nil {
		log.Errorf("failed to write ethernet config: %s", err)
		rsp.ErrRsp(c, -2, err.Error())
		return
	}

	// Delay the restart so the API response is sent before its own network path is replaced.
	go restartEthernetAfterResponse()
	_ = exec.Command("sync").Run()

	rsp.OkRsp(c)
	log.Infof("set ethernet config: mode=%s address=%s gateway=%s", config.Mode, config.Address, config.Gateway)
}

func readEthernetConfig() (proto.EthernetConfig, error) {
	config := proto.EthernetConfig{Mode: ethernetModeDHCP, Interface: ethernetInterface}
	file, err := os.Open(ethernetConfigFile)
	if os.IsNotExist(err) {
		return config, nil
	}
	if err != nil {
		return config, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) == 0 {
			continue
		}
		if len(fields) > 2 {
			return config, fmt.Errorf("invalid ethernet configuration")
		}

		prefix, err := netip.ParsePrefix(fields[0])
		if err != nil || !prefix.Addr().Is4() {
			return config, fmt.Errorf("invalid ethernet configuration")
		}
		if prefix.Bits() < 1 || prefix.Bits() > 30 {
			return config, fmt.Errorf("invalid ethernet configuration")
		}

		gateway := prefix.Masked().Addr().Next()
		if len(fields) == 2 {
			gateway, err = netip.ParseAddr(fields[1])
			if err != nil || !gateway.Is4() {
				return config, fmt.Errorf("invalid ethernet configuration")
			}
		}

		config.Mode = ethernetModeStatic
		config.Address = prefix.Addr().String()
		config.SubnetMask = prefix.Bits()
		config.Gateway = gateway.String()
		return config, nil
	}

	if err := scanner.Err(); err != nil {
		return config, err
	}
	return config, nil
}

func writeEthernetConfig(config proto.EthernetConfig) error {
	switch config.Mode {
	case ethernetModeDHCP:
		if err := os.Remove(ethernetConfigFile); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to enable dhcp: %w", err)
		}
		return nil
	case ethernetModeStatic:
		prefix, gateway, err := validateStaticEthernet(config.Address, config.SubnetMask, config.Gateway)
		if err != nil {
			return err
		}

		contents := fmt.Sprintf("%s %s\n", prefix.String(), gateway.String())
		tmpFile := ethernetConfigFile + ".tmp"
		if err := os.MkdirAll(filepath.Dir(ethernetConfigFile), 0o755); err != nil {
			return fmt.Errorf("failed to create ethernet configuration directory: %w", err)
		}
		if err := os.WriteFile(tmpFile, []byte(contents), 0o600); err != nil {
			return fmt.Errorf("failed to write ethernet configuration: %w", err)
		}
		if err := os.Rename(tmpFile, ethernetConfigFile); err != nil {
			return fmt.Errorf("failed to save ethernet configuration: %w", err)
		}
		return nil
	default:
		return fmt.Errorf("invalid ethernet mode")
	}
}

func validateStaticEthernet(address string, subnetMask int, gateway string) (netip.Prefix, netip.Addr, error) {
	ip, err := netip.ParseAddr(strings.TrimSpace(address))
	if err != nil || !ip.Is4() || !ip.IsValid() || ip.IsUnspecified() || ip.IsLoopback() || ip.IsMulticast() {
		return netip.Prefix{}, netip.Addr{}, fmt.Errorf("invalid static IP address")
	}
	if subnetMask < 1 || subnetMask > 30 {
		return netip.Prefix{}, netip.Addr{}, fmt.Errorf("subnet prefix must be between 1 and 30")
	}
	prefix := netip.PrefixFrom(ip, subnetMask)
	if ip == prefix.Masked().Addr() || ip == ipv4Broadcast(prefix) {
		return netip.Prefix{}, netip.Addr{}, fmt.Errorf("invalid static IP address")
	}

	gw, err := netip.ParseAddr(strings.TrimSpace(gateway))
	if err != nil || !gw.Is4() || !gw.IsValid() || gw.IsUnspecified() || gw.IsLoopback() || gw.IsMulticast() {
		return netip.Prefix{}, netip.Addr{}, fmt.Errorf("invalid gateway")
	}
	if !prefix.Contains(gw) || gw == ip || gw == prefix.Masked().Addr() {
		return netip.Prefix{}, netip.Addr{}, fmt.Errorf("gateway must be in the same subnet as the static IP")
	}

	return prefix, gw, nil
}

func ipv4Broadcast(prefix netip.Prefix) netip.Addr {
	address := prefix.Masked().Addr().As4()
	value := binary.BigEndian.Uint32(address[:])
	value |= (uint32(1) << (32 - prefix.Bits())) - 1
	var broadcast [4]byte
	binary.BigEndian.PutUint32(broadcast[:], value)
	return netip.AddrFrom4(broadcast)
}

func restartEthernetAfterResponse() {
	time.Sleep(time.Second)
	if err := exec.Command(ethernetInitScript, "restart").Run(); err != nil {
		log.Errorf("failed to restart ethernet: %s", err)
	}
}

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
)

const (
	ipv4ModeStatic = "static"
	ipv4ModeDHCP   = "dhcp"

	// ethStaticFile is read by /etc/init.d/S30eth on boot. If it exists, the
	// wired interface is brought up with a static address instead of DHCP.
	// Format per line: "<address>[/<prefix>] [gateway]".
	ethStaticFile = "/boot/eth.nodhcp"
	ethInitScript = "/etc/init.d/S30eth"

	// Delay before re-applying the network configuration. Gives the HTTP
	// response time to reach the browser before the connection is torn down.
	ipv4ApplyDelay = 800 * time.Millisecond
)

// GetIPv4 returns the configured wired-interface addressing mode plus the
// currently effective network details.
func (s *Service) GetIPv4(c *gin.Context) {
	var rsp proto.Response

	mode := currentIPv4Mode()

	var address, subnetMask, gateway string
	if mode == ipv4ModeStatic {
		address, subnetMask, gateway = readStaticIPv4()
	}

	info := getDNSInfo()

	rsp.OkRspWithData(c, &proto.GetIPv4Rsp{
		Mode:       mode,
		Address:    address,
		SubnetMask: subnetMask,
		Gateway:    gateway,
		Info:       info,
	})
	log.Debugf("get ipv4 config: mode=%s address=%s mask=%s gateway=%s info=%+v",
		mode, address, subnetMask, gateway, info)
}

// SetIPv4 switches the wired interface between DHCP and a static address.
// The configuration is applied asynchronously a short moment after the
// response is sent, because re-configuring eth0 drops the active connection.
func (s *Service) SetIPv4(c *gin.Context) {
	var req proto.SetIPv4Req
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	switch req.Mode {
	case ipv4ModeStatic:
		if err := setStaticIPv4(req.Address, req.SubnetMask, req.Gateway); err != nil {
			log.Errorf("failed to set static ipv4: %s", err)
			rsp.ErrRsp(c, -2, err.Error())
			return
		}
	case ipv4ModeDHCP:
		if err := setDHCPIPv4(); err != nil {
			log.Errorf("failed to set dhcp ipv4: %s", err)
			rsp.ErrRsp(c, -3, err.Error())
			return
		}
	default:
		rsp.ErrRsp(c, -1, "invalid ipv4 mode")
		return
	}

	_ = exec.Command("sync").Run()

	// Reply first, then re-apply the network config so the browser still
	// receives the success response on the old address.
	rsp.OkRsp(c)
	applyIPv4Async()

	log.Debugf("set ipv4 config: mode=%s address=%s mask=%s gateway=%s",
		req.Mode, req.Address, req.SubnetMask, req.Gateway)
}

func currentIPv4Mode() string {
	if _, err := os.Stat(ethStaticFile); err == nil {
		return ipv4ModeStatic
	}
	return ipv4ModeDHCP
}

// readStaticIPv4 parses the first usable line of ethStaticFile into a plain
// address, dotted subnet mask and gateway.
func readStaticIPv4() (address, subnetMask, gateway string) {
	file, err := os.Open(ethStaticFile)
	if err != nil {
		return "", "", ""
	}
	defer func() { _ = file.Close() }()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		fields := strings.Fields(line)
		inet := fields[0]
		gw := ""
		if len(fields) > 1 {
			gw = fields[1]
		}

		addr := inet
		prefix := 16 // S30eth default when no prefix is given
		if idx := strings.Index(inet, "/"); idx >= 0 {
			addr = inet[:idx]
			if p, perr := strconv.Atoi(inet[idx+1:]); perr == nil && p >= 1 && p <= 32 {
				prefix = p
			}
		}

		return addr, prefixToMask(prefix), gw
	}

	return "", "", ""
}

func setStaticIPv4(address, subnetMask, gateway string) error {
	address = strings.TrimSpace(address)
	subnetMask = strings.TrimSpace(subnetMask)
	gateway = strings.TrimSpace(gateway)

	if !isValidIPv4(address) {
		return fmt.Errorf("invalid ip address")
	}

	prefix, ok := maskToPrefix(subnetMask)
	if !ok {
		return fmt.Errorf("invalid subnet mask")
	}

	if !isValidIPv4(gateway) {
		return fmt.Errorf("invalid gateway")
	}

	// Sanity check: gateway must sit inside the configured subnet, otherwise
	// the device would lose its default route and become unreachable.
	if !sameSubnet(address, gateway, prefix) {
		return fmt.Errorf("gateway is not in the same subnet")
	}

	line := fmt.Sprintf("%s/%d %s\n", address, prefix, gateway)
	if err := os.WriteFile(ethStaticFile, []byte(line), 0o644); err != nil {
		return fmt.Errorf("failed to write static ipv4 config: %w", err)
	}

	return nil
}

func setDHCPIPv4() error {
	if err := os.Remove(ethStaticFile); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove static ipv4 config: %w", err)
	}
	return nil
}

// applyIPv4Async restarts the wired-interface init script after a short delay.
func applyIPv4Async() {
	go func() {
		time.Sleep(ipv4ApplyDelay)
		if err := exec.Command("sh", "-c", ethInitScript+" restart").Run(); err != nil {
			log.Errorf("failed to restart %s: %s", ethInitScript, err)
		}
	}()
}

func isValidIPv4(value string) bool {
	ip := net.ParseIP(value)
	return ip != nil && ip.To4() != nil
}

// maskToPrefix converts a dotted IPv4 subnet mask (e.g. 255.255.255.0) into a
// prefix length, rejecting non-contiguous masks.
func maskToPrefix(mask string) (int, bool) {
	ip := net.ParseIP(mask)
	if ip == nil {
		return 0, false
	}
	v4 := ip.To4()
	if v4 == nil {
		return 0, false
	}

	netMask := net.IPMask(v4)
	prefix, bits := netMask.Size() // Size returns 0,0 for non-contiguous masks
	if bits != 32 || prefix < 1 || prefix > 32 {
		return 0, false
	}

	return prefix, true
}

func prefixToMask(prefix int) string {
	if prefix < 0 || prefix > 32 {
		return ""
	}
	mask := net.CIDRMask(prefix, 32)
	return net.IP(mask).String()
}

func sameSubnet(a, b string, prefix int) bool {
	ipA := net.ParseIP(a).To4()
	ipB := net.ParseIP(b).To4()
	if ipA == nil || ipB == nil {
		return false
	}

	mask := net.CIDRMask(prefix, 32)
	return ipA.Mask(mask).Equal(ipB.Mask(mask))
}

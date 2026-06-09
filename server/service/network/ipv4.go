package network

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
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

	// After applying a static address the user must confirm reachability within
	// this window. If they don't, the previous configuration is restored. This
	// prevents locking yourself out with a wrong static IP.
	ipv4ConfirmWindow = 5 * time.Minute

	// Persisted across restarts so a reboot during the confirmation window does
	// not bypass the safety net.
	ipv4PendingFile = "/etc/kvm/ipv4_pending.json"
)

// ipv4Snapshot captures the wired config so it can be restored on revert.
type ipv4Snapshot struct {
	HadStatic bool   `json:"hadStatic"` // whether eth.nodhcp existed before the change
	Content   string `json:"content"`   // its previous content (only if static)
}

// ipv4Pending describes a static change awaiting confirmation.
type ipv4Pending struct {
	Deadline time.Time    `json:"deadline"`
	Revert   ipv4Snapshot `json:"revert"`
}

var (
	ipv4Mu    sync.Mutex
	ipv4Timer *time.Timer
	ipv4Pend  *ipv4Pending
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
	pending, remaining := ipv4PendingStatus()

	rsp.OkRspWithData(c, &proto.GetIPv4Rsp{
		Mode:             mode,
		Address:          address,
		SubnetMask:       subnetMask,
		Gateway:          gateway,
		Info:             info,
		Pending:          pending,
		RemainingSeconds: remaining,
	})
	log.Debugf("get ipv4 config: mode=%s address=%s mask=%s gateway=%s pending=%v",
		mode, address, subnetMask, gateway, pending)
}

// SetIPv4 switches the wired interface between DHCP and a static address.
// The configuration is applied asynchronously a short moment after the
// response is sent, because re-configuring eth0 drops the active connection.
//
// A static change is applied "on trial": the previous configuration is captured
// and automatically restored unless the user confirms reachability (via
// ConfirmIPv4) within ipv4ConfirmWindow. Switching to DHCP is inherently safe
// and is applied immediately, cancelling any pending trial.
func (s *Service) SetIPv4(c *gin.Context) {
	var req proto.SetIPv4Req
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	switch req.Mode {
	case ipv4ModeStatic:
		// Capture the current config BEFORE overwriting it, so we can revert
		// to it if the new address turns out to be unreachable.
		snapshot := captureIPv4Snapshot()

		if err := setStaticIPv4(req.Address, req.SubnetMask, req.Gateway); err != nil {
			log.Errorf("failed to set static ipv4: %s", err)
			rsp.ErrRsp(c, -2, err.Error())
			return
		}

		_ = exec.Command("sync").Run()

		// Reply first, then re-apply the config and arm the auto-revert.
		rsp.OkRsp(c)
		applyIPv4Async()
		armIPv4Confirm(snapshot, ipv4ConfirmWindow)

	case ipv4ModeDHCP:
		// DHCP is the safe fallback; drop any pending trial and apply directly.
		cancelIPv4Confirm()

		if err := setDHCPIPv4(); err != nil {
			log.Errorf("failed to set dhcp ipv4: %s", err)
			rsp.ErrRsp(c, -3, err.Error())
			return
		}

		_ = exec.Command("sync").Run()

		rsp.OkRsp(c)
		applyIPv4Async()

	default:
		rsp.ErrRsp(c, -1, "invalid ipv4 mode")
		return
	}

	log.Debugf("set ipv4 config: mode=%s address=%s mask=%s gateway=%s",
		req.Mode, req.Address, req.SubnetMask, req.Gateway)
}

// ConfirmIPv4 confirms a pending static-IP change and cancels the scheduled
// auto-revert. It is idempotent: confirming with nothing pending succeeds.
func (s *Service) ConfirmIPv4(c *gin.Context) {
	var rsp proto.Response

	cancelIPv4Confirm()

	rsp.OkRsp(c)
	log.Debug("ipv4 static change confirmed")
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

// ---------------------------------------------------------------------------
// Confirm / auto-revert ("commit confirmed") for static-IP changes.
// ---------------------------------------------------------------------------

// captureIPv4Snapshot records the current wired config so it can be restored.
func captureIPv4Snapshot() ipv4Snapshot {
	data, err := os.ReadFile(ethStaticFile)
	if err != nil {
		return ipv4Snapshot{HadStatic: false}
	}
	return ipv4Snapshot{HadStatic: true, Content: string(data)}
}

// restoreIPv4Snapshot writes back a captured config and re-applies it.
func restoreIPv4Snapshot(s ipv4Snapshot) {
	if s.HadStatic {
		_ = os.WriteFile(ethStaticFile, []byte(s.Content), 0o644)
	} else {
		_ = os.Remove(ethStaticFile)
	}
	_ = exec.Command("sync").Run()
	if err := exec.Command("sh", "-c", ethInitScript+" restart").Run(); err != nil {
		log.Errorf("ipv4 revert: failed to restart %s: %s", ethInitScript, err)
	}
}

// armIPv4Confirm starts (or restarts) the confirmation window. If it elapses
// without a ConfirmIPv4 call, the captured snapshot is restored.
func armIPv4Confirm(snapshot ipv4Snapshot, window time.Duration) {
	ipv4Mu.Lock()
	defer ipv4Mu.Unlock()

	if ipv4Timer != nil {
		ipv4Timer.Stop()
	}

	ipv4Pend = &ipv4Pending{Deadline: time.Now().Add(window), Revert: snapshot}
	persistIPv4Pending(ipv4Pend)

	ipv4Timer = time.AfterFunc(window, func() {
		ipv4Mu.Lock()
		pending := ipv4Pend
		ipv4Pend = nil
		ipv4Timer = nil
		clearIPv4PendingFile()
		ipv4Mu.Unlock()

		if pending != nil {
			log.Warnf("ipv4: static change not confirmed within %s, reverting", window)
			restoreIPv4Snapshot(pending.Revert)
		}
	})
}

// cancelIPv4Confirm clears any pending trial (used on confirm or DHCP switch).
func cancelIPv4Confirm() {
	ipv4Mu.Lock()
	defer ipv4Mu.Unlock()

	if ipv4Timer != nil {
		ipv4Timer.Stop()
		ipv4Timer = nil
	}
	ipv4Pend = nil
	clearIPv4PendingFile()
}

// ipv4PendingStatus reports whether a trial is active and how many seconds
// remain before auto-revert.
func ipv4PendingStatus() (bool, int) {
	ipv4Mu.Lock()
	defer ipv4Mu.Unlock()

	if ipv4Pend == nil {
		return false, 0
	}
	remaining := int(time.Until(ipv4Pend.Deadline).Seconds())
	if remaining < 0 {
		remaining = 0
	}
	return true, remaining
}

func persistIPv4Pending(p *ipv4Pending) {
	data, err := json.Marshal(p)
	if err != nil {
		return
	}
	_ = os.WriteFile(ipv4PendingFile, data, 0o600)
}

func clearIPv4PendingFile() {
	_ = os.Remove(ipv4PendingFile)
}

// InitIPv4Recovery handles a pending trial that survived a restart. A reboot
// during the confirmation window counts as "not confirmed": if the window has
// already elapsed, revert immediately; otherwise re-arm the timer for the
// remaining time so the user can still confirm. Call once at startup.
func InitIPv4Recovery() {
	data, err := os.ReadFile(ipv4PendingFile)
	if err != nil {
		return
	}

	var p ipv4Pending
	if err := json.Unmarshal(data, &p); err != nil {
		clearIPv4PendingFile()
		return
	}

	remaining := time.Until(p.Deadline)
	if remaining <= 0 {
		log.Warn("ipv4: pending static change expired during downtime, reverting")
		clearIPv4PendingFile()
		restoreIPv4Snapshot(p.Revert)
		return
	}

	log.Warnf("ipv4: pending static change found, re-arming confirm timer (%s left)",
		remaining.Round(time.Second))
	armIPv4Confirm(p.Revert, remaining)
}

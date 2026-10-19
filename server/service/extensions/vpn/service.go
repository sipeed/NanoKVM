package vpn

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/extensions/netbird"
	"NanoKVM-Server/service/extensions/tailscale"
	"NanoKVM-Server/service/extensions/vpnpref"
	"fmt"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

// tailscaleServiceRunning is kept as a package seam so the switching policy
// can be tested without manufacturing a real /proc tailscaled process.
var tailscaleServiceRunning = func() (bool, error) {
	return tailscale.NewCli().ServiceRunning()
}

// netbirdCanStartAtBoot is a package seam for the boot-selection policy. The
// NetBird package owns that check because it owns its version marker format
// and installation paths.
var netbirdCanStartAtBoot = netbird.CanStartAtBoot

// These package seams keep the preference transition testable without real
// VPN daemons or the device's /etc state. Production uses the functions below.
var (
	vpnPreferenceRead  = vpnpref.Read
	vpnPreferenceWrite = vpnpref.Write
	vpnClientFor       = cliFor
	vpnBootable        = bootable
	vpnRunning         = running
	vpnConnected       = connected
	vpnCanResume       = canResume
)

func NewService() *Service {
	return &Service{}
}

func (s *Service) GetPreference(c *gin.Context) {
	var rsp proto.Response

	rsp.OkRspWithData(c, &proto.GetVPNPreferenceRsp{VPN: vpnpref.Read()})
}

// SetPreference records which client autostarts, and — only when that is safe —
// stops the other one.
//
// The preference governs boot. It is not a permission to run: both clients can be
// started at any time, and the daemons coexist (only one tunnel is up, and the
// memory cost is transient). That separation exists because of one scenario: this
// device is normally reached *through* the VPN being switched away from. The old
// design stopped the current client first and started the new one, which on a
// remote device meant the session died before the incoming client was usable —
// and NetBird's first login is interactive, so it was never usable in time. The
// device could not be recovered without physical or LAN access.
//
// So the rule is: never stop a working tunnel until the incoming one is proven
// connected. If nothing is running there is nothing to lose, and the preference
// is recorded without touching either client.
func (s *Service) SetPreference(c *gin.Context) {
	var req proto.SetVPNPreferenceReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	vpn := strings.TrimSpace(req.VPN)
	if !vpnpref.IsValid(vpn) {
		rsp.ErrRsp(c, -2, "vpn must be 'tailscale' or 'netbird'")
		return
	}

	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	defer vpnpref.Unlock()
	// This request owns the shared lifecycle lock. Invalidate a pending
	// VPN download before inspecting or changing VPN state, so it cannot
	// later promote and start after this newer operation has completed.
	vpnpref.InvalidateStagedInstalls()

	// The comparison belongs under the same lock as the state transition. A
	// request that read the old value before another request completed a switch
	// must not subsequently perform an unnecessary second transition.
	if vpn == vpnPreferenceRead() {
		rsp.OkRspWithData(c, &proto.GetVPNPreferenceRsp{VPN: vpn})
		return
	}

	other := otherVPN(vpn)

	// select_vpn removes the other client's init script at the next boot, so the
	// incoming one has to be something it can actually start.
	if !vpnBootable(vpn) {
		rsp.ErrRsp(c, -7, fmt.Sprintf("%s cannot start at boot: install it, and for Tailscale start it once", vpn))
		return
	}

	stoppedOther := false
	if vpnRunning(other) {
		if !vpnConnected(vpn) {
			rsp.ErrRsp(c, -6, fmt.Sprintf(
				"%s is not connected yet — start it and finish signing in before making it the autostart VPN, "+
					"otherwise stopping %s now would cut the connection you are using", vpn, other))
			return
		}

		// The preference write happens after the old tunnel is stopped. Do not
		// make that destructive transition when its rollback is already known
		// to be impossible — notably, a NetBird binary with no install marker,
		// or a Tailscale whose init script is gone.
		if err := vpnCanResume(other); err != nil {
			rsp.ErrRsp(c, -3, fmt.Sprintf(
				"%s is connected, but %s cannot be safely resumed if saving the preference fails: %v",
				vpn, other, err))
			return
		}

		oldClient := vpnClientFor(other)
		// This is an internal runtime transition, not the user's explicit
		// "disable Tailscale at boot" action. In particular, it must leave S98
		// in place so the write-failure rollback below can really resume it.
		if err := oldClient.StopRuntime(); err != nil {
			log.Errorf("failed to stop %s: %s", other, err)
			rsp.ErrRsp(c, -3, fmt.Sprintf("%s is connected, but stopping %s did not complete: %v", vpn, other, err))
			return
		}
		stoppedOther = true
	}

	// Written last, so the file never claims a state the device is not in. If it
	// cannot be written, the client that was carrying the session has just been
	// stopped while the file still names it — put it back rather than leave the
	// device relying on whatever the next boot happens to do.
	if err := vpnPreferenceWrite(vpn); err != nil {
		log.Errorf("failed to write VPN preference: %s", err)

		if !stoppedOther {
			rsp.ErrRsp(c, -4, fmt.Sprintf("write preference failed: %v", err))
			return
		}

		if rbErr := vpnClientFor(other).Resume(); rbErr != nil {
			rsp.ErrRsp(c, -4, fmt.Sprintf("write preference failed: %v; %s could not be restarted: %v", err, other, rbErr))
			return
		}

		rsp.ErrRsp(c, -4, fmt.Sprintf("write preference failed: %v; %s was restarted", err, other))
		return
	}

	log.Infof("VPN autostart set to %s", vpn)
	rsp.OkRspWithData(c, &proto.GetVPNPreferenceRsp{VPN: vpn})
}

type vpnClient interface {
	Resume() error
	StopRuntime() error
}

func otherVPN(vpn string) string {
	if vpn == vpnpref.Netbird {
		return vpnpref.Tailscale
	}

	return vpnpref.Netbird
}

func cliFor(vpn string) vpnClient {
	if vpn == vpnpref.Netbird {
		return netbird.NewCli()
	}

	return tailscale.NewCli()
}

// canResume checks whether the stopped client has the static prerequisites for
// the preference-write rollback: for NetBird, a binary this installer attested;
// for Tailscale, the init script that its Resume call will execute.
func canResume(vpn string) error {
	if vpn == vpnpref.Netbird {
		return netbird.NewCli().CanResume()
	}
	return tailscale.NewCli().CanResume()
}

// running reports whether the client's daemon is up. A client that is not
// running cannot be cut off, so switching away from it is always safe.
func running(vpn string) bool {
	if vpn == vpnpref.Netbird {
		isRunning, err := netbird.NewCli().ServiceRunning()
		if err != nil {
			// Uncertainty is treated as "running". Guessing "not running" would
			// skip the connectivity gate below and stop nothing, which is how a
			// live client keeps carrying a tunnel the preference says is gone.
			return true
		}

		return isRunning
	}

	// Status can fail while tailscaled is still alive (for example during a
	// transient local-socket failure). Use the same /proc identity check as its
	// lifecycle operations, and fail closed on uncertainty just like NetBird.
	isRunning, err := tailscaleServiceRunning()
	if err != nil {
		return true
	}
	return isRunning
}

// bootable reports whether select_vpn could actually start this client at the
// next boot. "Installed" is not enough, and the two clients differ: the boot
// script restores S99netbird from /kvmapp when the NetBird binary is executable,
// but never restores S98tailscaled — a Tailscale that was stopped through the UI
// stays stopped, by design. Handing autostart to a client the boot script cannot
// start would leave the device with nothing.
func bootable(vpn string) bool {
	if vpn == vpnpref.Netbird {
		return netbirdCanStartAtBoot()
	}
	return tailscaleBootable(tailscale.TailscaledPath, tailscale.TailscalePath, tailscale.ScriptPath)
}

func tailscaleBootable(tailscaledPath, tailscalePath, scriptPath string) bool {
	info, err := os.Stat(tailscaledPath)
	if err != nil || !info.Mode().IsRegular() || info.Mode()&0o111 == 0 {
		return false
	}
	info, err = os.Stat(tailscalePath)
	if err != nil || !info.Mode().IsRegular() || info.Mode()&0o111 == 0 {
		return false
	}

	info, err = os.Stat(scriptPath)
	return err == nil && info.Mode().IsRegular() && info.Mode()&0o111 != 0
}

// connected reports whether the client actually carries a tunnel right now —
// not merely that its daemon is alive. This is the gate that prevents a remote
// lockout, so it is deliberately strict: anything short of a confirmed
// connection counts as not connected.
func connected(vpn string) bool {
	if vpn == vpnpref.Netbird {
		status, err := netbird.NewCli().StatusOnly()
		if err != nil {
			return false
		}

		return status.Management.Connected && status.Signal.Connected
	}

	status, err := tailscale.NewCli().Status()
	if err != nil {
		return false
	}

	return status.BackendState == "Running"
}

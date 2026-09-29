package tailscale

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/extensions/vpnpref"
	"NanoKVM-Server/utils"
	"errors"
	"fmt"
	"net"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

var installMu sync.Mutex

const (
	TailscalePath  = "/usr/bin/tailscale"
	TailscaledPath = "/usr/sbin/tailscaled"

	GoMemLimit int64 = 75
)

var StateMap = map[string]proto.TailscaleState{
	"NoState":          proto.TailscaleNotRunning,
	"Starting":         proto.TailscaleNotRunning,
	"NeedsLogin":       proto.TailscaleNotLogin,
	"NeedsMachineAuth": proto.TailscaleNotLogin,
	"InUseOtherUser":   proto.TailscaleNotLogin,
	"Running":          proto.TailscaleRunning,
	"Stopped":          proto.TailscaleStopped,
}

func NewService() *Service {
	return &Service{}
}

// lockVPN serializes operations that start or stop a client.
//
// It deliberately does NOT check the autostart preference. That preference says
// what runs at boot, not who may run now: gating these handlers on it made the
// first NetBird login unreachable (login needs the preference, the preference
// needs a connected client) and, worse, let a switch cut the tunnel the caller
// was connected through. Mutual exclusion is enforced where it belongs — in
// SetPreference, which stops the other client only once this one is connected.
//
// Both daemons may therefore be up briefly while a user sets the new one up. That
// overlap is deliberate: the alternative — refusing — is what locked devices out.
func lockVPN(c *gin.Context, rsp *proto.Response) bool {
	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return false
	}

	// A Tailscale lifecycle action is newer than any pending VPN install.
	// The shared lifecycle lock gives this invalidation a total order with the
	// final promote-and-start step, while keeping the slow download unlocked.
	vpnpref.InvalidateStagedInstalls()

	return true
}

func (s *Service) Install(c *gin.Context) {
	var rsp proto.Response

	if !installMu.TryLock() {
		rsp.ErrRsp(c, -5, "a tailscale installation is already in progress")
		return
	}
	defer installMu.Unlock()
	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	if isInstalled() {
		vpnpref.InvalidateStagedInstalls()
		vpnpref.Unlock()
		rsp.OkRsp(c)
		return
	}
	ctx, token, finish := vpnpref.BeginStagedInstall(c.Request.Context())
	vpnpref.Unlock()
	defer finish()

	stage, err := stageLatestInstall(ctx, installHTTPClient, [2]string{TailscalePath, TailscaledPath})
	if err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("install failed: %v", err))
		return
	}
	defer stage.cleanup()
	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	defer vpnpref.Unlock()
	if !vpnpref.StagedInstallCurrent(token) || ctx.Err() != nil {
		rsp.ErrRsp(c, -2, "install was canceled by a newer VPN operation")
		return
	}
	vpnpref.InvalidateOtherStagedInstalls(token)
	cli := NewCli()
	running, err := cli.ServiceRunning()
	if err != nil || running {
		rsp.ErrRsp(c, -1, "tailscaled may be running; stop it before installing")
		return
	}
	if ctx.Err() != nil || !vpnpref.StagedInstallCurrent(token) {
		rsp.ErrRsp(c, -2, "install was canceled")
		return
	}
	if err := stage.promote(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("install failed: %v", err))
		return
	}
	if err := cli.Start(); err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("installed, but start failed: %v", err))
		return
	}

	rsp.OkRsp(c)
	log.Debugf("install tailscale successfully")
}

func (s *Service) Uninstall(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	// Never unlink a client that may still be running. In particular, an
	// executable can remain mapped after unlink and would no longer have a
	// reliable init-script path for recovery.
	if err := NewCli().Stop(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("stop failed, nothing was removed: %v", err))
		log.Errorf("failed to stop tailscale before uninstall: %s", err)
		return
	}
	if err := utils.DelGoMemLimit(); err != nil && !os.IsNotExist(err) {
		log.Warnf("failed to remove tailscale memory limit: %s", err)
	}

	var removeErrs []error
	for _, path := range []string{TailscalePath, TailscaledPath} {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			removeErrs = append(removeErrs, fmt.Errorf("remove %s: %w", path, err))
		}
	}
	if err := errors.Join(removeErrs...); err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("uninstall incomplete: %v", err))
		log.Errorf("failed to uninstall tailscale: %s", err)
		return
	}

	// Uninstalling a VPN is valid on a LAN-managed device. Do not start another
	// client or rewrite the boot preference behind the user's back.

	rsp.OkRsp(c)
	log.Debugf("uninstall tailscale successfully")
}

func (s *Service) Start(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Start()
	if err != nil {
		rsp.ErrRsp(c, -1, "start failed")
		log.Errorf("failed to run tailscale start: %s", err)
		return
	}

	if !utils.IsGoMemLimitExist() {
		_ = utils.SetGoMemLimit(GoMemLimit)
	}

	rsp.OkRsp(c)
	log.Debugf("tailscale start successfully")
}

func (s *Service) Restart(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Restart()
	if err != nil {
		rsp.ErrRsp(c, -1, "restart failed")
		log.Errorf("failed to run tailscale restart: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("tailscale restart successfully")
}

func (s *Service) Stop(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Stop()
	if err != nil {
		rsp.ErrRsp(c, -1, "stop failed")
		log.Errorf("failed to run tailscale stop: %s", err)
		return
	}

	_ = utils.DelGoMemLimit()

	rsp.OkRsp(c)
	log.Debugf("tailscale stop successfully")
}

func (s *Service) Up(c *gin.Context) {
	var rsp proto.Response

	// `tailscale up` brings the tunnel up — same guard as Start.
	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Up()
	if err != nil {
		rsp.ErrRsp(c, -1, "tailscale up failed")
		log.Errorf("failed to run tailscale up: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("run tailscale up successfully")
}

func (s *Service) Down(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Down()
	if err != nil {
		rsp.ErrRsp(c, -1, "tailscale down failed")
		log.Errorf("failed to run tailscale down: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("run tailscale down successfully")
}

func (s *Service) Login(c *gin.Context) {
	var rsp proto.Response

	// Serialize setup and URL issuance with Stop/Down/SetPreference. The lock is
	// released immediately after Cli.Login returns its URL; the long interactive
	// browser phase is owned by Cli's cancellable login process, not this mutex.
	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	// check tailscale status
	cli := NewCli()
	status, err := cli.Status()
	if err != nil {
		// No preference check: refusing here is what used to make signing in
		// impossible on a device set to the other client.
		_ = cli.Start()

		status, err = cli.Status()
	}

	if err != nil {
		log.Errorf("failed to get tailscale status: %s", err)
		rsp.ErrRsp(c, -1, "unknown status")
		return
	}

	if status.BackendState == "Running" {
		rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{})
		return
	}

	// get login url
	url, err := cli.Login()
	if err != nil {
		log.Errorf("failed to run tailscale login: %s", err)
		rsp.ErrRsp(c, -2, "login failed")
		return
	}

	if !utils.IsGoMemLimitExist() {
		_ = utils.SetGoMemLimit(GoMemLimit)
	}

	rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{
		Url: url,
	})

	// The login URL authorizes a device session. It belongs only in the API
	// response sent to the requesting browser, never in a server log.
	log.Debug("tailscale login URL issued")
}

func (s *Service) Logout(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	err := NewCli().Logout()
	if err != nil {
		rsp.ErrRsp(c, -1, "logout failed")
		log.Errorf("failed to run tailscale logout: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("tailscale logout successfully")
}

func (s *Service) GetStatus(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		state := proto.TailscaleNotInstall
		// Do not label a crash between the two no-replace links as a clean
		// "not installed" state: Install correctly refuses to overwrite that
		// artifact, while NotRunning keeps the Uninstall recovery action visible.
		if hasInstalledArtifacts() {
			state = proto.TailscaleNotRunning
		}
		rsp.OkRspWithData(c, &proto.GetTailscaleStatusRsp{
			State: state,
		})
		return
	}

	status, err := NewCli().Status()
	if err != nil {
		log.Debugf("failed to get tailscale status: %s", err)
		rsp.OkRspWithData(c, &proto.GetTailscaleStatusRsp{
			State: proto.TailscaleNotRunning,
		})
		return
	}

	state, ok := StateMap[status.BackendState]
	if !ok {
		log.Errorf("unknown tailscale state: %s", status.BackendState)
		rsp.ErrRsp(c, -1, "unknown state")
		return
	}

	ipv4 := ""
	for _, tailscaleIp := range status.Self.TailscaleIPs {
		ip := net.ParseIP(tailscaleIp)
		if ip != nil && ip.To4() != nil {
			ipv4 = ip.String()
		}
	}

	data := proto.GetTailscaleStatusRsp{
		State:   state,
		IP:      ipv4,
		Name:    status.Self.HostName,
		Account: status.CurrentTailnet.Name,
	}

	rsp.OkRspWithData(c, &data)
	log.Debugf("get tailscale status successfully")
}

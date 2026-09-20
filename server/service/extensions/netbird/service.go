package netbird

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/extensions/vpnpref"
	"context"
	"fmt"
	"net"
	"sync"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

// installMu is intentionally separate from vpnpref's lifecycle lock. Download
// and archive validation can take minutes on NanoKVM's uplink; serialising
// those slow bytes must not make Stop/Restart/other-VPN recovery unavailable.
// It stays held until promotion so two concurrent initial installs cannot race
// to publish different binaries.
var installMu sync.Mutex

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
// Both daemons may therefore be up briefly while a user sets the new one up. For
// a client that was never bound this costs memory only; one that was bound before
// may reconnect, so two tunnels are possible during a switch. That overlap is
// deliberate: the alternative — refusing — is what locked devices out.
func lockVPN(c *gin.Context, rsp *proto.Response) bool {
	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return false
	}

	return true
}

// stageIfNeeded obtains a validated binary outside the VPN lifecycle lock.
// The caller must invoke release after it has either promoted or discarded the
// result. A nil stage means a usable binary was already installed.
func stageIfNeeded(parent context.Context) (stage *StagedInstall, generation uint64, release func(), err error) {
	if isInstalled() {
		return nil, 0, func() {}, nil
	}
	if !installMu.TryLock() {
		return nil, 0, nil, fmt.Errorf("a netbird installation is already in progress")
	}

	// The winner may have finished between the optimistic check and TryLock.
	if isInstalled() {
		return nil, 0, installMu.Unlock, nil
	}

	if !vpnpref.TryLock() {
		installMu.Unlock()
		return nil, 0, nil, fmt.Errorf("another VPN operation is in progress, please retry")
	}
	installContext, generation, finish := vpnpref.BeginStagedInstall(parent)
	vpnpref.Unlock()
	release = func() {
		finish()
		installMu.Unlock()
	}
	stage, err = StageInstallContext(installContext)
	if err != nil {
		release()
		return nil, 0, nil, err
	}
	return stage, generation, release, nil
}

// stageUpdate downloads the pinned release while the VPN lifecycle lock is
// free, exactly like stageIfNeeded. It refuses when there is nothing to update:
// an update replaces a live installation, which is far more disruptive than an
// install, and must never run because a pin or marker happened to be unreadable.
func stageUpdate(parent context.Context) (stage *StagedInstall, generation uint64, release func(), err error) {
	if !isInstalled() {
		return nil, 0, nil, fmt.Errorf("netbird is not installed")
	}
	if !UpdateAvailable() {
		return nil, 0, nil, fmt.Errorf("installed netbird is already the version this firmware ships")
	}
	if !installMu.TryLock() {
		return nil, 0, nil, fmt.Errorf("a netbird installation is already in progress")
	}

	if !vpnpref.TryLock() {
		installMu.Unlock()
		return nil, 0, nil, fmt.Errorf("another VPN operation is in progress, please retry")
	}
	installContext, generation, finish := vpnpref.BeginStagedInstall(parent)
	vpnpref.Unlock()
	release = func() {
		finish()
		installMu.Unlock()
	}
	stage, err = StageInstallContext(installContext)
	if err != nil {
		release()
		return nil, 0, nil, err
	}
	return stage, generation, release, nil
}

func promoteIfNeeded(stage *StagedInstall) error {
	if stage == nil {
		return nil
	}
	defer func() { _ = stage.Cleanup() }()

	// A daemon can survive after its executable was removed (its /proc/exe
	// target then has the " (deleted)" suffix). Linking a newly staged binary in
	// that state would make the version marker attest to the new inode while the
	// old daemon continues to serve requests. Do the observation immediately
	// before publication, while the caller holds vpnpref's lifecycle lock. An
	// observation failure is equally unsafe: it is not evidence that no daemon
	// exists.
	return promoteAfterDaemonCheck(NewCli().ServiceRunning, stage.Promote)
}

// promoteAfterDaemonCheck keeps the safety decision independently testable.
// Callers must hold the VPN lifecycle lock for the whole check-and-promote
// sequence, so API lifecycle operations cannot start a daemon between them.
func promoteAfterDaemonCheck(serviceRunning func() (bool, error), promote func() error) error {
	running, err := serviceRunning()
	if err != nil {
		return fmt.Errorf("inspect netbird daemon before install: %w", err)
	}
	if running {
		return fmt.Errorf("netbird daemon is running; refusing to publish a replacement binary")
	}
	return promote()
}

func (s *Service) Install(c *gin.Context) {
	var rsp proto.Response

	stage, generation, release, err := stageIfNeeded(c.Request.Context())
	if err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("install failed: %v", err))
		return
	}
	defer release()
	if stage != nil {
		defer func() { _ = stage.Cleanup() }()
	}

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	if stage != nil && (!vpnpref.StagedInstallCurrent(generation) || c.Request.Context().Err() != nil) {
		rsp.ErrRsp(c, -2, "install was canceled by a newer VPN operation")
		return
	}
	vpnpref.InvalidateOtherStagedInstalls(generation)
	if stage == nil && isInstalled() && !installAttested(getInstalledVersion()) {
		rsp.ErrRsp(c, -3, errNetbirdNotAttested.Error())
		return
	}
	if err := promoteIfNeeded(stage); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("install failed: %v", err))
		log.Errorf("failed to install netbird: %s", err)
		return
	}

	// Start the daemon regardless of which client owns autostart, so signing in
	// is reachable while the other client still carries the session.
	//
	// S99netbird runs `netbird service run`; the tunnel is raised by `netbird up`,
	// which is the login step. On a device that has never been bound — the case
	// this exists for — the daemon therefore carries no tunnel. A device that was
	// bound earlier may well reconnect on daemon start; that is not verified here,
	// and it is accepted: the overlap is user-initiated and ends when the switch
	// is completed.
	if err := NewCli().Start(); err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("start failed: %v", err))
		log.Errorf("failed to start netbird after install: %s", err)
		return
	}

	rsp.OkRsp(c)
}

// Update replaces an installed client with the release this firmware ships.
//
// It is the only path that overwrites a NetBird binary, and it is deliberately
// an explicit user action rather than something a boot or an OTA performs: the
// daemon has to be stopped for the replacement, so on a device reached through
// NetBird this briefly drops the tunnel that carries the request. The UI says
// so before the button is offered. A device that was already bound reconnects
// when the new daemon starts; that is not verified here, which is why nothing
// does this on the device's behalf.
func (s *Service) Update(c *gin.Context) {
	var rsp proto.Response

	stage, generation, release, err := stageUpdate(c.Request.Context())
	if err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("update failed: %v", err))
		return
	}
	defer release()
	defer func() { _ = stage.Cleanup() }()

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	if !vpnpref.StagedInstallCurrent(generation) || c.Request.Context().Err() != nil {
		rsp.ErrRsp(c, -2, "update was canceled by a newer VPN operation")
		return
	}
	vpnpref.InvalidateOtherStagedInstalls(generation)

	// Stop the runtime, not the installation: StopRuntime leaves S99netbird in
	// place, so the client comes back at the next boot even if this request
	// fails after this point.
	if err := NewCli().StopRuntime(); err != nil {
		rsp.ErrRsp(c, -3, fmt.Sprintf("update failed: stopping netbird did not complete: %v", err))
		log.Errorf("failed to stop netbird before update: %s", err)
		return
	}

	// A daemon that survived the stop would keep serving from the old inode
	// while the marker starts naming the new one. Replace only once the stop
	// is observed to have taken effect.
	if err := replaceAfterDaemonCheck(NewCli().ServiceRunning, stage.Replace); err != nil {
		rsp.ErrRsp(c, -4, fmt.Sprintf("update failed: %v", err))
		log.Errorf("failed to replace netbird: %s", err)
		return
	}

	if err := NewCli().Start(); err != nil {
		// The new binary and marker are committed, so the client is whole; only
		// this start failed. Report it and leave the recovery actions available
		// rather than claiming a running daemon.
		rsp.ErrRsp(c, -5, fmt.Sprintf("netbird was updated, but starting it failed: %v", err))
		log.Errorf("failed to start netbird after update: %s", err)
		return
	}

	rsp.OkRsp(c)
}

// replaceAfterDaemonCheck mirrors promoteAfterDaemonCheck: it keeps the safety
// decision testable without a real daemon. An inspection error is treated as a
// running daemon, because it is not evidence of the opposite.
func replaceAfterDaemonCheck(serviceRunning func() (bool, error), replace func() error) error {
	running, err := serviceRunning()
	if err != nil {
		return fmt.Errorf("inspect netbird daemon before update: %w", err)
	}
	if running {
		return fmt.Errorf("netbird daemon is still running; refusing to replace its binary")
	}
	return replace()
}

func (s *Service) Uninstall(c *gin.Context) {
	var rsp proto.Response

	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	defer vpnpref.Unlock()
	vpnpref.InvalidateStagedInstalls()

	// Order matters. Stop first and check the result: removing the init script
	// from under a live daemon would leave a process nothing on the device can
	// stop any more.
	if err := NewCli().Stop(); err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("stop failed, nothing was removed: %v", err))
		log.Errorf("failed to stop netbird before uninstall: %s", err)
		return
	}

	if err := uninstall(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("uninstall failed: %v", err))
		log.Errorf("failed to uninstall netbird: %s", err)
		return
	}

	// A device can intentionally be managed over LAN only. Never select or
	// start Tailscale as a side effect of uninstalling NetBird; preserve the
	// recorded boot preference so the user remains in control of recovery.
	rsp.OkRsp(c)
}

func (s *Service) Start(c *gin.Context) {
	var rsp proto.Response

	stage, generation, release, err := stageIfNeeded(c.Request.Context())
	if err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("start failed: %v", err))
		return
	}
	defer release()
	if stage != nil {
		defer func() { _ = stage.Cleanup() }()
	}

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	if stage != nil && (!vpnpref.StagedInstallCurrent(generation) || c.Request.Context().Err() != nil) {
		rsp.ErrRsp(c, -2, "start was canceled by a newer VPN operation")
		return
	}
	vpnpref.InvalidateOtherStagedInstalls(generation)
	if stage == nil && isInstalled() && !installAttested(getInstalledVersion()) {
		rsp.ErrRsp(c, -3, errNetbirdNotAttested.Error())
		return
	}
	if err := promoteIfNeeded(stage); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("start failed: %v", err))
		log.Errorf("failed to install netbird before start: %s", err)
		return
	}

	if err := NewCli().Start(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("start failed: %v", err))
		log.Errorf("failed to start netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Restart(c *gin.Context) {
	var rsp proto.Response

	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()
	vpnpref.InvalidateStagedInstalls()
	// Start and Install already fail closed on a binary this firmware cannot
	// vouch for. Restart is also a start path: checking before stopping the
	// current daemon avoids dropping a connection this request could not bring
	// back. A client merely older than the pin is brought back — the update is
	// offered in the UI, and refusing here would strand a remote operator.
	if isInstalled() && !installAttested(getInstalledVersion()) {
		rsp.ErrRsp(c, -3, errNetbirdNotAttested.Error())
		return
	}

	if err := NewCli().Restart(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("restart failed: %v", err))
		log.Errorf("failed to restart netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Stop(c *gin.Context) {
	var rsp proto.Response

	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	defer vpnpref.Unlock()
	vpnpref.InvalidateStagedInstalls()

	if err := NewCli().Stop(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("stop failed: %v", err))
		log.Errorf("failed to stop netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Login(c *gin.Context) {
	var rsp proto.Response

	// `netbird up` brings the tunnel up, so this belongs behind the same guard as
	// Start: on a device set to Tailscale it would raise a second one.
	if !lockVPN(c, &rsp) {
		return
	}
	defer vpnpref.Unlock()

	cli := NewCli()
	vpnpref.InvalidateStagedInstalls()
	// Login executes `netbird up` and can create a tunnel. Do not let it become
	// an unchecked start path for a binary this firmware cannot vouch for.
	if isInstalled() && !installAttested(getInstalledVersion()) {
		rsp.ErrRsp(c, -3, errNetbirdNotAttested.Error())
		return
	}

	url, err := cli.Login()
	if err != nil {
		log.Errorf("failed to run netbird login: %s", err)
		rsp.ErrRsp(c, -2, fmt.Sprintf("login failed: %v", err))
		return
	}

	rsp.OkRspWithData(c, &proto.LoginNetbirdRsp{
		Url: url,
	})

	// The URL is a one-time device-binding secret; log that we got one, not what it is.
	log.Debugf("netbird login url issued: %t", url != "")
}

func (s *Service) Down(c *gin.Context) {
	var rsp proto.Response

	// Down and the other lifecycle endpoints share this lock. It also cancels an
	// outstanding interactive Login before changing the tunnel state.
	if !vpnpref.TryLock() {
		rsp.ErrRsp(c, -5, "another VPN operation is in progress, please retry")
		return
	}
	defer vpnpref.Unlock()
	vpnpref.InvalidateStagedInstalls()

	if err := NewCli().Down(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("netbird down failed: %v", err))
		log.Errorf("failed to run netbird down: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) GetStatus(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		rsp.OkRspWithData(c, &proto.GetNetbirdStatusRsp{
			State:   proto.NetbirdNotInstall,
			Version: getPinnedVersion(),
		})
		return
	}

	cli := NewCli()
	running, err := cli.ServiceRunning()
	if err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("service status failed: %v", err))
		return
	}

	if !running {
		rsp.OkRspWithData(c, &proto.GetNetbirdStatusRsp{
			State:            proto.NetbirdNotRunning,
			Version:          getInstalledVersion(),
			PinnedVersion:    getPinnedVersion(),
			InstalledVersion: getInstalledVersion(),
			UpdateAvailable:  UpdateAvailable(),
		})
		return
	}

	status, err := cli.Status()
	if err != nil {
		// Do not turn a timeout, malformed JSON or daemon I/O error into a
		// confident disconnected/login state. The UI treats this transport
		// error as unknown/stale and leaves recovery actions available.
		rsp.ErrRsp(c, -2, fmt.Sprintf("netbird status unavailable: %v", err))
		return
	}

	state := proto.NetbirdNotLogin
	if status.Management.Connected && status.Signal.Connected {
		state = proto.NetbirdRunning
	} else if status.Management.URL != "" {
		state = proto.NetbirdStopped
	}

	rsp.OkRspWithData(c, &proto.GetNetbirdStatusRsp{
		State:            state,
		Name:             status.FQDN,
		IP:               getIPv4(status.IP),
		Version:          firstNonEmpty(status.DaemonVersion, getInstalledVersion()),
		PinnedVersion:    getPinnedVersion(),
		InstalledVersion: getInstalledVersion(),
		UpdateAvailable:  UpdateAvailable(),
	})
}

func getIPv4(ip string) string {
	if ip == "" {
		return ""
	}

	if addr, _, err := net.ParseCIDR(ip); err == nil && addr != nil {
		if ipv4 := addr.To4(); ipv4 != nil {
			return ipv4.String()
		}
		return addr.String()
	}

	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ip
	}

	if parsed.To4() != nil {
		return parsed.String()
	}

	return ""
}

func firstNonEmpty(items ...string) string {
	for _, item := range items {
		if item != "" {
			return item
		}
	}

	return ""
}

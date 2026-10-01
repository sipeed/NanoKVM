package tailscale

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"context"
	"net"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

const (
	TailscalePath  = "/usr/bin/tailscale"
	TailscaledPath = "/usr/sbin/tailscaled"

	GoMemLimit int64 = 75

	versionCheckTimeout = 30 * time.Second
	updateTimeout       = 10 * time.Minute
	restartDelay        = time.Second
	restartTimeout      = 30 * time.Second
)

var operationMutex sync.Mutex

func beginOperation(c *gin.Context, rsp *proto.Response) bool {
	if operationMutex.TryLock() {
		return true
	}

	rsp.ErrRsp(c, -1, "another tailscale operation is in progress")
	return false
}

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

func (s *Service) Install(c *gin.Context) {
	var rsp proto.Response
	if !beginOperation(c, &rsp) {
		return
	}
	defer operationMutex.Unlock()

	if !isInstalled() {
		if err := install(); err != nil {
			rsp.ErrRsp(c, -1, "install failed")
			return
		}

		_ = NewCli().Start()
	}

	rsp.OkRsp(c)
	log.Debugf("install tailscale successfully")
}

func (s *Service) Uninstall(c *gin.Context) {
	var rsp proto.Response
	if !beginOperation(c, &rsp) {
		return
	}
	defer operationMutex.Unlock()

	_ = NewCli().Stop()
	_ = utils.DelGoMemLimit()

	_ = os.Remove(TailscalePath)
	_ = os.Remove(TailscaledPath)

	rsp.OkRsp(c)
	log.Debugf("uninstall tailscale successfully")
}

func (s *Service) Start(c *gin.Context) {
	var rsp proto.Response
	if !beginOperation(c, &rsp) {
		return
	}
	defer operationMutex.Unlock()

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
	if !beginOperation(c, &rsp) {
		return
	}
	defer operationMutex.Unlock()

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
	if !beginOperation(c, &rsp) {
		return
	}
	defer operationMutex.Unlock()

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

	// check tailscale status
	cli := NewCli()
	status, err := cli.Status()
	if err != nil {
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

	log.Debugf("tailscale login url: %s", url)
}

func (s *Service) Logout(c *gin.Context) {
	var rsp proto.Response

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
		rsp.OkRspWithData(c, &proto.GetTailscaleStatusRsp{
			State: proto.TailscaleNotInstall,
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

func (s *Service) GetVersion(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		rsp.ErrRsp(c, -1, "tailscale not installed")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), versionCheckTimeout)
	defer cancel()

	version, err := NewCli().Version(ctx, true)
	if err != nil {
		log.Errorf("failed to get tailscale version: %s", err)
		rsp.ErrRsp(c, -2, "failed to get tailscale version")
		return
	}

	rsp.OkRspWithData(c, &proto.GetTailscaleVersionRsp{
		Current: version.Current,
		Latest:  version.Latest,
	})
	log.Debugf("get tailscale version successfully: current=%s latest=%s", version.Current, version.Latest)
}

func (s *Service) Update(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		rsp.ErrRsp(c, -1, "tailscale not installed")
		return
	}
	if !beginOperation(c, &rsp) {
		return
	}
	restartPending := false
	defer func() {
		if !restartPending {
			operationMutex.Unlock()
		}
	}()

	// Once an update starts, finish it even if the browser disconnects. This is
	// especially important when NanoKVM itself is reached through Tailscale.
	ctx, cancel := context.WithTimeout(context.Background(), updateTimeout)
	defer cancel()

	cli := NewCli()
	before, err := cli.Version(ctx, false)
	if err != nil {
		log.Errorf("failed to get current tailscale version: %s", err)
		rsp.ErrRsp(c, -3, "failed to get current tailscale version")
		return
	}

	wasRunning := cli.IsRunning()
	if err = cli.Update(ctx); err != nil {
		log.Errorf("failed to update tailscale: %s", err)
		rsp.ErrRsp(c, -4, "tailscale update failed")
		return
	}

	after, err := cli.Version(ctx, false)
	if err != nil {
		if wasRunning {
			restartPending = true
			restartTailscaleAfterResponse()
		}
		log.Errorf("failed to verify tailscale update: %s", err)
		rsp.ErrRsp(c, -5, "failed to verify tailscale update")
		return
	}

	updated := before.Current != after.Current
	restarting := updated && wasRunning
	rsp.OkRspWithData(c, &proto.UpdateTailscaleRsp{
		Current:    after.Current,
		Updated:    updated,
		Restarting: restarting,
	})

	if restarting {
		// The Tailscale updater does not recognize NanoKVM's S98tailscaled
		// Buildroot init script. Restart after sending the response so updating a
		// device through its Tailscale address does not fail in the browser.
		restartPending = true
		restartTailscaleAfterResponse()
	}

	log.Infof("tailscale update completed: before=%s after=%s restarting=%t", before.Current, after.Current, restarting)
}

func restartTailscaleAfterResponse() {
	go func() {
		defer operationMutex.Unlock()
		time.Sleep(restartDelay)

		ctx, cancel := context.WithTimeout(context.Background(), restartTimeout)
		defer cancel()
		if restartErr := NewCli().RestartAfterUpdate(ctx); restartErr != nil {
			log.Errorf("tailscale updated but failed to restart: %s", restartErr)
		}
	}()
}

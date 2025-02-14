package tailscale

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"net"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

const (
	TailscalePath  = "/usr/bin/tailscale"
	TailscaledPath = "/usr/sbin/tailscaled"
	ConfigPath     = "etc/sysctl.d/99-tailscale.conf"
)

var StateMap = map[string]proto.TailscaleState{
	"NoState":    proto.TailscaleNotRunning,
	"Starting":   proto.TailscaleNotRunning,
	"NeedsLogin": proto.TailscaleNotLogin,
	"Running":    proto.TailscaleRunning,
	"Stopped":    proto.TailscaleStopped,
}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Install(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		if err := install(); err != nil {
			rsp.ErrRsp(c, -1, "install failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("install tailscale successfully")
}

func (s *Service) Uninstall(c *gin.Context) {
	var rsp proto.Response

	_ = NewCli().Stop()
	_ = utils.DelGoMemLimit()

	_ = os.Remove(TailscalePath)
	_ = os.Remove(TailscaledPath)
	_ = os.Remove(ConfigPath)

	rsp.OkRsp(c)
	log.Debugf("uninstall tailscale successfully")
}

func (s *Service) Start(c *gin.Context) {
	var rsp proto.Response

	err := NewCli().Start()
	if err != nil {
		rsp.ErrRsp(c, -1, "start failed")
		log.Errorf("failed to run tailscale start: %s", err)
		return
	}

	if !utils.IsGoMemLimitExist() {
		_ = utils.SetGoMemLimit(50)
	}

	rsp.OkRsp(c)
	log.Debugf("tailscale start successfully")
}

func (s *Service) Restart(c *gin.Context) {
	var rsp proto.Response

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
		_ = utils.SetGoMemLimit(50)
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

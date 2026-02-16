package netbird

import (
	"NanoKVM-Server/proto"
	"fmt"
	"net"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Install(c *gin.Context) {
	var rsp proto.Response

	if err := install(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("install failed: %v", err))
		log.Errorf("failed to install netbird: %s", err)
		return
	}

	if err := NewCli().Start(); err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("start failed: %v", err))
		log.Errorf("failed to start netbird after install: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Uninstall(c *gin.Context) {
	var rsp proto.Response

	_ = NewCli().Stop()

	if err := uninstall(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("uninstall failed: %v", err))
		log.Errorf("failed to uninstall netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Start(c *gin.Context) {
	var rsp proto.Response

	if !isInstalled() {
		if err := install(); err != nil {
			rsp.ErrRsp(c, -1, fmt.Sprintf("start failed: %v", err))
			log.Errorf("failed to install netbird before start: %s", err)
			return
		}
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

	if err := NewCli().Restart(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("restart failed: %v", err))
		log.Errorf("failed to restart netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Stop(c *gin.Context) {
	var rsp proto.Response

	if err := NewCli().Stop(); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("stop failed: %v", err))
		log.Errorf("failed to stop netbird: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Up(c *gin.Context) {
	var req proto.UpNetbirdReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	cli := NewCli()
	running, err := cli.ServiceRunning()
	if err != nil {
		rsp.ErrRsp(c, -2, fmt.Sprintf("service status failed: %v", err))
		return
	}
	if !running {
		if err := cli.Start(); err != nil {
			rsp.ErrRsp(c, -3, fmt.Sprintf("service start failed: %v", err))
			return
		}
	}

	if err := cli.Up(req.SetupKey, req.ManagementURL, req.AdminURL); err != nil {
		rsp.ErrRsp(c, -4, fmt.Sprintf("netbird up failed: %v", err))
		log.Errorf("failed to run netbird up: %s", err)
		return
	}

	rsp.OkRsp(c)
}

func (s *Service) Down(c *gin.Context) {
	var rsp proto.Response

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
			Version: getBundledVersion(),
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
			State:   proto.NetbirdNotRunning,
			Version: getInstalledVersion(),
		})
		return
	}

	status, err := cli.Status()
	if err != nil {
		lower := strings.ToLower(err.Error())
		state := proto.NetbirdStopped
		if strings.Contains(lower, "run up command") ||
			strings.Contains(lower, "setup-key") ||
			strings.Contains(lower, "login") {
			state = proto.NetbirdNotLogin
		}

		rsp.OkRspWithData(c, &proto.GetNetbirdStatusRsp{
			State:   state,
			Version: getInstalledVersion(),
		})
		return
	}

	state := proto.NetbirdNotLogin
	if status.Management.Connected && status.Signal.Connected {
		state = proto.NetbirdRunning
	} else if status.Management.URL != "" {
		state = proto.NetbirdStopped
	}

	rsp.OkRspWithData(c, &proto.GetNetbirdStatusRsp{
		State:         state,
		Name:          status.FQDN,
		IP:            getIPv4(status.IP),
		ManagementURL: status.Management.URL,
		Version:       firstNonEmpty(status.DaemonVersion, getInstalledVersion()),
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

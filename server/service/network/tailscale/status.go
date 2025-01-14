package tailscale

import (
	"NanoKVM-Server/proto"
	"net"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var StateMap = map[string]proto.TailscaleState{
	"NoState":    proto.TailscaleNotRunning,
	"Starting":   proto.TailscaleNotRunning,
	"NeedsLogin": proto.TailscaleNotLogin,
	"Running":    proto.TailscaleRunning,
	"Stopped":    proto.TailscaleStopped,
}

func GetStatus(c *gin.Context) {
	var rsp proto.Response

	if !IsInstalled() {
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

func Up(c *gin.Context) {
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

func Down(c *gin.Context) {
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

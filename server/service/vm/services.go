package vm

import (
	"fmt"
	"os"
	"os/exec"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// Services whose init scripts are guarded by an enable flag in /etc/kvm
// (presence of the flag file = enabled). The flag is the single source of
// truth shared with the init scripts and the dedicated UIs (mDNS, tailscale,
// picoclaw) that manage their own flags.
type service struct {
	flag   string // enable flag file (presence = enabled)
	script string // init script name (resolved under /etc/init.d or /kvmapp/system/init.d)
}

var services = map[string]service{
	"ssdpd":    {flag: "/etc/kvm/enable-ssdpd", script: "S50ssdpd"},
	"dnsmasq":  {flag: "/etc/kvm/enable-dnsmasq", script: "S80dnsmasq"},
	"picoclaw": {flag: "/etc/kvm/enable-picoclaw", script: "S96picoclaw"},
	// avahi intentionally absent: it has its own dedicated UI (Device tab
	// mDNS toggle) whose handlers manage /etc/kvm/enable-avahi.
	// tailscale intentionally absent: dedicated Tailscale tab.
}

func resolveInitScript(name string) string {
	for _, dir := range []string{"/etc/init.d", "/kvmapp/system/init.d"} {
		p := dir + "/" + name
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "/etc/init.d/" + name
}

func (s *Service) GetServices(c *gin.Context) {
	var rsp proto.Response

	states := make(map[string]proto.ServiceState, len(services))
	for name, svc := range services {
		_, err := os.Stat(svc.flag)
		states[name] = proto.ServiceState{Enabled: err == nil}
	}

	rsp.OkRspWithData(c, &proto.GetServicesRsp{Services: states})
}

func (s *Service) EnableService(c *gin.Context) {
	s.setService(c, true)
}

func (s *Service) DisableService(c *gin.Context) {
	s.setService(c, false)
}

func (s *Service) setService(c *gin.Context, enabled bool) {
	var req proto.SetServiceReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, fmt.Sprintf("invalid arguments: %s", err))
		return
	}

	svc, ok := services[req.Service]
	if !ok {
		rsp.ErrRsp(c, -2, "unknown service")
		return
	}

	if enabled {
		if err := os.WriteFile(svc.flag, []byte(""), 0o644); err != nil {
			log.Errorf("failed to write %s: %s", svc.flag, err)
			rsp.ErrRsp(c, -3, "failed to enable service")
			return
		}
		_ = exec.Command("sh", "-c", resolveInitScript(svc.script)+" start").Run()
	} else {
		_ = os.Remove(svc.flag)
		_ = exec.Command("sh", "-c", resolveInitScript(svc.script)+" stop").Run()
	}

	rsp.OkRsp(c)
	log.Debugf("service %s %s", req.Service, map[bool]string{true: "enabled", false: "disabled"}[enabled])
}

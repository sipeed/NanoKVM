package vm

import (
	"os"
	"os/exec"
	"strconv"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
)

// Read-only diagnostics aggregated from the files/commands used to debug the
// device (video pipeline, HDMI capture, hardware revision, services, firewall).

func (s *Service) GetDiagnostics(c *gin.Context) {
	var rsp proto.Response

	hdmiEnabled := !isHdmiDisabled()

	rsp.OkRspWithData(c, &proto.GetDiagnosticsRsp{
		Version: proto.DiagnosticsVersion{
			App:            readTrimmed("/kvmapp/version"),
			Image:          getImageVersion(),
			Hw:             readTrimmed("/etc/kvm/hw"),
			HdmiVersion:    readTrimmed("/etc/kvm/hdmi_version"),
			DeviceKey:      getDeviceKey(),
			Hostname:       readTrimmed("/etc/hostname"),
			PreviewUpdates: fileExists("/etc/kvm/preview_updates"),
		},
		Video: proto.DiagnosticsVideo{
			NowFps:      readInt("/kvmapp/kvm/now_fps"),
			State:       readInt("/kvmapp/kvm/state"),
			Type:        readTrimmed("/kvmapp/kvm/type"),
			Width:       readInt("/kvmapp/kvm/width"),
			Height:      readInt("/kvmapp/kvm/height"),
			Qlty:        readInt("/kvmapp/kvm/qlty"),
			Res:         readInt("/kvmapp/kvm/res"),
			HdmiSignal:  hdmiEnabled && getHdmiSignal(),
			HdmiEnabled: hdmiEnabled,
		},
		Processes: map[string]bool{
			"server":    pidRunning("NanoKVM-Server"),
			"kvmSystem": pidRunning("kvm_system"),
			"avahi":     pidRunning("avahi-daemon"),
			"ssdpd":     pidRunning("ssdpd"),
			"dnsmasq":   pidRunning("dnsmasq"),
			"picoclaw":  pidRunning("picoclaw"),
			"tailscale": pidRunning("tailscaled"),
		},
		Firewall: proto.DiagnosticsFirewall{
			InputPolicy: getInputPolicy(),
		},
	})
}

func readTrimmed(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readInt(path string) int {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0
	}
	n, _ := strconv.Atoi(strings.TrimSpace(string(data)))
	return n
}

func pidRunning(name string) bool {
	return exec.Command("pidof", name).Run() == nil
}

func getInputPolicy() string {
	out, err := exec.Command("sh", "-c", "iptables -S INPUT 2>/dev/null | head -1").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

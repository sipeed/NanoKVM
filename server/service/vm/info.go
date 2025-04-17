package vm

import (
	"NanoKVM-Server/config"
	"fmt"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

var imageVersionMap = map[string]string{
	"2024-06-23-20-59-2d2bfb.img": "v1.0.0",
	"2024-07-23-20-18-587710.img": "v1.1.0",
	"2024-08-08-19-44-bef2ca.img": "v1.2.0",
	"2024-11-13-09-59-9c961a.img": "v1.3.0",
	"2025-02-17-19-08-3649fe.img": "v1.4.0",
	"2025-04-17-14-21-98d17d.img": "v1.4.1",
}

func (s *Service) GetInfo(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetInfoRsp{
		IPs:         getIPs(),
		Mdns:        getMdns(),
		Image:       getImageVersion(),
		Application: getApplicationVersion(),
		DeviceKey:   getDeviceKey(),
	}

	rsp.OkRspWithData(c, data)
	log.Debug("get vm information success")
}

func getIPs() (ips []proto.IP) {
	interfaces, err := GetInterfaceInfos()
	if err != nil {
		return
	}

	for _, iface := range interfaces {
		if iface.IP.To4() != nil {
			ips = append(ips, proto.IP{
				Name:    iface.Name,
				Addr:    iface.IP.String(),
				Version: "IPv4",
				Type:    iface.Type,
			})
		}
	}

	return
}

func getMdns() string {
	if pid := getAvahiDaemonPid(); pid == "" {
		return ""
	}

	content, err := os.ReadFile("/etc/hostname")
	if err != nil {
		return ""
	}

	mdns := strings.ReplaceAll(string(content), "\n", "")
	return fmt.Sprintf("%s.local", mdns)
}

func getImageVersion() string {
	content, err := os.ReadFile("/boot/ver")
	if err != nil {
		return ""
	}

	image := strings.ReplaceAll(string(content), "\n", "")

	if version, ok := imageVersionMap[image]; ok {
		return version
	}

	return image
}

func getApplicationVersion() string {
	content, err := os.ReadFile("/kvmapp/version")
	if err != nil {
		return "1.0.0"
	}

	return strings.ReplaceAll(string(content), "\n", "")
}

func getDeviceKey() string {
	content, err := os.ReadFile("/device_key")
	if err != nil {
		return ""
	}

	return strings.ReplaceAll(string(content), "\n", "")
}

func (s *Service) GetHardware(c *gin.Context) {
	var rsp proto.Response

	conf := config.GetInstance()
	version := conf.Hardware.Version.String()

	rsp.OkRspWithData(c, &proto.GetHardwareRsp{
		Version: version,
	})
}

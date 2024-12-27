package vm

import (
	"fmt"
	"net"
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
}

func (s *Service) GetInfo(c *gin.Context) {
	var rsp proto.Response

	data := &proto.GetInfoRsp{
		Ip:          getIp(),
		Mdns:        getMdns(),
		Image:       getImageVersion(),
		Application: getApplicationVersion(),
		DeviceKey:   getDeviceKey(),
	}

	rsp.OkRspWithData(c, data)
	log.Debug("get vm information success")
}

func getIp() string {
	addressList, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}

	for _, address := range addressList {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
			ip := ipnet.IP.String()
			return ip
		}
	}

	return ""
}

func getMdns() string {
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

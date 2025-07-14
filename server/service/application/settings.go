package application

import (
	"NanoKVM-Server/config"
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	DeviceTLS          = "device:tls"
	DeviceSSH          = "device:ssh"
	DeviceMDNS         = "device:mdns"
	DeviceHDMI         = "device:hdmi"
	DeviceWIFI         = "device:wifi"
	DeviceMouse        = "device:mouse"
	DeviceReboot       = "device:reboot"
	DeviceOLED         = "device:oled"
	DeviceAdvance      = "device:advance"
	DeviceAdvancedSwap = "device:advance:swap"
)

const (
	MenuScript           = "script"
	MenuImage            = "image"
	MenuDownload         = "download"
	MenuTerminal         = "terminal"
	MenuScreen           = "screen"
	MenuScreenResolution = "screen:resolution"
)

func (s *Service) GetDisableItems(ctx *gin.Context) {
	var rsp proto.Response
	switch config.GetHwVersion() {
	case config.HWVersionPcie, config.HWVersionATX:
		rsp.OkRspWithData(ctx, []string{
			DeviceAdvancedSwap,
			DeviceAdvance,
			MenuScreenResolution,
		})
		log.Debugf("disable menus items %s", DeviceAdvancedSwap)
		return
	default:
		rsp.OkRspWithData(ctx, []string{})
	}
}

func (s *Service) GetDisableMenus(ctx *gin.Context) {
	var rsp proto.Response
	switch config.GetHwVersion() {
	case config.HWVersionPcie, config.HWVersionATX:
		rsp.OkRspWithData(ctx, []string{
			DeviceAdvancedSwap,
			DeviceAdvance,
			MenuScreenResolution,
		})
		log.Debugf("disable menus items %s", DeviceAdvancedSwap)
		return
	default:
		rsp.OkRspWithData(ctx, []string{})
	}
}

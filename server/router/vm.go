package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/vm"
)

func vmRouter(r *gin.Engine) {
	service := vm.NewService()

	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/vm/info", service.GetInfo)         // get device information
	api.GET("/vm/hardware", service.GetHardware) // get hardware version

	api.POST("/vm/gpio", service.SetGpio)     // update gpio
	api.GET("/vm/gpio", service.GetGpio)      // get gpio
	api.POST("/vm/screen", service.SetScreen) // update screen

	// api.GET("/vm/terminal", service.Terminal) // web terminal

	api.GET("/vm/script", service.GetScripts) // get script
	// api.POST("/vm/script/upload", service.UploadScript) // upload script
	// api.POST("/vm/script/run", service.RunScript)       // run script
	// api.DELETE("/vm/script", service.DeleteScript)      // delete script

	api.GET("/vm/device/virtual", service.GetVirtualDevice) // get virtual device
	// api.POST("/vm/device/virtual", service.UpdateVirtualDevice) // update virtual device

	api.GET("/vm/memory/limit", service.GetMemoryLimit) // get memory limit
	// api.POST("/vm/memory/limit", service.SetMemoryLimit) // set memory limit

	api.GET("/vm/oled", service.GetOLED) // get OLED configuration
	// api.POST("/vm/oled", service.SetOLED) // set OLED configuration

	// Only supported by PCIe version
	api.GET("/vm/hdmi", service.GetHdmiState) // get HDMI state
	// api.POST("/vm/hdmi/reset", service.ResetHdmi)     // reset hdmi
	// api.POST("/vm/hdmi/enable", service.EnableHdmi)   // enable hdmi
	// api.POST("/vm/hdmi/disable", service.DisableHdmi) // disable hdmi

	// api.GET("/vm/ssh", service.GetSSHState)         // get SSH state
	// api.POST("/vm/ssh/enable", service.EnableSSH)   // enable SSH
	// api.POST("/vm/ssh/disable", service.DisableSSH) // disable SSH

	api.GET("/vm/swap", service.GetSwap) // get swap file size
	// api.POST("/vm/swap", service.SetSwap) // set swap file size

	api.GET("/vm/mouse-jiggler", service.GetMouseJiggler) // get mouse jiggler
	//api.POST("/vm/mouse-jiggler/", service.SetMouseJiggler) // set mouse jiggler

	api.GET("/vm/hostname", service.GetHostname) // Get Hostname
	// api.POST("/vm/hostname", service.SetHostname) // Set Hostname

	api.GET("/vm/web-title", service.GetWebTitle) // Get web title
	// api.POST("/vm/web-title", service.SetWebTitle) // Set web title

	// api.GET("/vm/mdns", service.GetMdnsState)         // get mDNS state
	// api.POST("/vm/mdns/enable", service.EnableMdns)   // enable mDNS
	// api.POST("/vm/mdns/disable", service.DisableMdns) // disable mDNS

	api.POST("/vm/tls", service.SetTls) // enable/disable TLS

	api.POST("/vm/system/reboot", service.Reboot) // reboot system
}

func vmAdminRouter(r *gin.Engine) {
	service := vm.NewService()
	api := r.Group("/api").Use(middleware.CheckAdminToken())

	api.GET("/vm/terminal", service.Terminal) // web terminal

	api.POST("/vm/script/upload", service.UploadScript) // upload script
	api.POST("/vm/script/run", service.RunScript)       // run script
	api.DELETE("/vm/script", service.DeleteScript)      // delete script

	api.POST("/vm/device/virtual", service.UpdateVirtualDevice) // update virtual device

	api.POST("/vm/memory/limit", service.SetMemoryLimit) // set memory limit

	api.POST("/vm/oled", service.SetOLED) // set OLED configuration

	api.POST("/vm/hdmi/reset", service.ResetHdmi)     // reset hdmi
	api.POST("/vm/hdmi/enable", service.EnableHdmi)   // enable hdmi
	api.POST("/vm/hdmi/disable", service.DisableHdmi) // disable hdmi

	api.GET("/vm/ssh", service.GetSSHState)         // get SSH state
	api.POST("/vm/ssh/enable", service.EnableSSH)   // enable SSH
	api.POST("/vm/ssh/disable", service.DisableSSH) // disable SSH

	api.POST("/vm/swap", service.SetSwap) // set swap file size

	api.POST("/vm/mouse-jiggler/", service.SetMouseJiggler) // set mouse jiggler

	api.POST("/vm/hostname", service.SetHostname) // Set Hostname

	api.POST("/vm/web-title", service.SetWebTitle) // Set web title

	api.GET("/vm/mdns", service.GetMdnsState)         // get mDNS state
	api.POST("/vm/mdns/enable", service.EnableMdns)   // enable mDNS
	api.POST("/vm/mdns/disable", service.DisableMdns) // disable mDNS
}

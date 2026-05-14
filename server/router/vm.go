package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/vm"
)

func vmRouter(r *gin.Engine) {
	service := vm.NewService()

	// All authenticated users (viewer, operator, admin) may read basic info
	anyAPI := r.Group("/api").Use(middleware.CheckToken())
	anyAPI.GET("/vm/info", service.GetInfo)
	anyAPI.GET("/vm/hardware", service.GetHardware)
	anyAPI.GET("/vm/gpio", service.GetGpio)
	anyAPI.GET("/vm/device/virtual", service.GetVirtualDevice)
	anyAPI.GET("/vm/memory/limit", service.GetMemoryLimit)
	anyAPI.GET("/vm/oled", service.GetOLED)
	anyAPI.GET("/vm/hdmi", service.GetHdmiState)
	anyAPI.GET("/vm/ssh", service.GetSSHState)
	anyAPI.GET("/vm/swap", service.GetSwap)
	anyAPI.GET("/vm/mouse-jiggler", service.GetMouseJiggler)
	anyAPI.GET("/vm/hostname", service.GetHostname)
	anyAPI.GET("/vm/web-title", service.GetWebTitle)
	anyAPI.GET("/vm/mdns", service.GetMdnsState)
	anyAPI.GET("/vm/autostart", service.GetAutostart)
	anyAPI.GET("/vm/autostart/:name", service.GetAutostartContent)

	// Operator and admin may interact with the machine
	opAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin, middleware.RoleOperator),
	)
	opAPI.POST("/vm/gpio", service.SetGpio)         // power/reset buttons
	opAPI.GET("/vm/terminal", service.Terminal)     // web terminal
	opAPI.GET("/vm/script", service.GetScripts)
	opAPI.POST("/vm/script/run", service.RunScript)
	opAPI.POST("/vm/mouse-jiggler/", service.SetMouseJiggler)

	// Admin only: system configuration
	adminAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin),
	)
	adminAPI.POST("/vm/screen", service.SetScreen)
	adminAPI.POST("/vm/script/upload", service.UploadScript)
	adminAPI.DELETE("/vm/script", service.DeleteScript)
	adminAPI.POST("/vm/device/virtual", service.UpdateVirtualDevice)
	adminAPI.POST("/vm/memory/limit", service.SetMemoryLimit)
	adminAPI.POST("/vm/oled", service.SetOLED)
	adminAPI.POST("/vm/hdmi/reset", service.ResetHdmi)
	adminAPI.POST("/vm/hdmi/enable", service.EnableHdmi)
	adminAPI.POST("/vm/hdmi/disable", service.DisableHdmi)
	adminAPI.POST("/vm/ssh/enable", service.EnableSSH)
	adminAPI.POST("/vm/ssh/disable", service.DisableSSH)
	adminAPI.POST("/vm/swap", service.SetSwap)
	adminAPI.POST("/vm/hostname", service.SetHostname)
	adminAPI.POST("/vm/web-title", service.SetWebTitle)
	adminAPI.POST("/vm/mdns/enable", service.EnableMdns)
	adminAPI.POST("/vm/mdns/disable", service.DisableMdns)
	adminAPI.POST("/vm/tls", service.SetTls)
	adminAPI.DELETE("/vm/autostart/:name", service.DeleteAutostart)
	adminAPI.POST("/vm/autostart/:name", service.UploadAutostart)
	adminAPI.POST("/vm/system/reboot", service.Reboot)
}

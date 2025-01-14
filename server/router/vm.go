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

	api.GET("/vm/terminal", service.Terminal) // web terminal

	api.GET("/vm/script", service.GetScripts)           // get script
	api.POST("/vm/script/upload", service.UploadScript) // upload script
	api.POST("/vm/script/run", service.RunScript)       // run script
	api.DELETE("/vm/script", service.DeleteScript)      // delete script

	api.GET("/vm/device/virtual", service.GetVirtualDevice)     // get virtual device
	api.POST("/vm/device/virtual", service.UpdateVirtualDevice) // update virtual device

	api.GET("/vm/memory/limit", service.GetMemoryLimit)  // get memory limit
	api.POST("/vm/memory/limit", service.SetMemoryLimit) // set memory limit

	api.GET("/vm/oled", service.GetOLED)  // get OLED configuration
	api.POST("/vm/oled", service.SetOLED) // set OLED configuration

	api.POST("/vm/hdmi/reset", service.ResetHdmi) // reset hdmi (pcie only)
}

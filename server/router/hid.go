package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/hid"
)

func hidRouter(r *gin.Engine) {
	service := hid.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.POST("/hid/reset", service.Reset) // reset hid
	api.POST("/hid/paste", service.Paste) // paste

	api.GET("/hid/bios", service.GetBiosMode)  // get hid bios mode
	api.POST("/hid/bios", service.SetBiosMode) // set hid bios mode

	api.GET("/hid/wow", service.GetWoWMode)  // get hid wake on write mode
	api.POST("/hid/wow", service.SetWoWMode) // set hid wake on write mode

	api.GET("/hid/mode", service.GetHidMode)  // get hid mode
	api.POST("/hid/mode", service.SetHidMode) // set hid mode
}

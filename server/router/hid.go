package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/hid"
)

const internalUSBRecoverPath = "/api/internal/usb/recover"

func HIDLoopbackHTTPAllowedPaths() []string {
	return []string{internalUSBRecoverPath}
}

func hidRouter(r *gin.Engine) {
	service := hid.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())
	localAPI := r.Group("/api/internal").Use(middleware.CheckLoopbackInternalToken())

	api.POST("/hid/paste", service.Paste) // paste

	api.GET("/hid/shortcuts", service.GetShortcuts)     // get shortcuts
	api.POST("/hid/shortcut", service.AddShortcut)      // add shortcut
	api.DELETE("/hid/shortcut", service.DeleteShortcut) // delete shortcut

	api.GET("/hid/shortcut/leader-key", service.GetLeaderKey)  // set shortcut leader key
	api.POST("/hid/shortcut/leader-key", service.SetLeaderKey) // set shortcut leader key

	api.GET("/hid/mode", service.GetHidMode)  // get hid mode
	api.POST("/hid/mode", service.SetHidMode) // set hid mode
	api.POST("/hid/reset", service.ResetHid)  // reset hid

	localAPI.POST("/usb/recover", service.RecoverUSB)
}

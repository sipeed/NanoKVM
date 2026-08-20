package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/authn"
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

	api.GET("/hid/shortcuts", service.GetShortcuts)           // get shortcuts
	api.GET("/hid/shortcut/leader-key", service.GetLeaderKey) // get shortcut leader key

	api.GET("/hid/mode", service.GetHidMode) // get hid mode
	api.GET("/hid/leds", service.GetKeyboardLedStatus)

	admin := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(authn.RoleAdmin),
	)
	admin.POST("/hid/mode", service.SetHidMode) // set hid mode
	admin.POST("/hid/reset", service.ResetHid)  // reset hid
	admin.POST("/hid/shortcut", service.AddShortcut)
	admin.DELETE("/hid/shortcut", service.DeleteShortcut)
	admin.POST("/hid/shortcut/leader-key", service.SetLeaderKey)

	localAPI.POST("/usb/recover", service.RecoverUSB)
}

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
	view := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermConsoleView))
	control := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermConsoleControl))
	system := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermDevice))
	localAPI := r.Group("/api/internal").Use(middleware.CheckLoopbackInternalToken())

	control.POST("/hid/paste", service.Paste) // paste

	view.GET("/hid/shortcuts", service.GetShortcuts)           // get shortcuts
	view.GET("/hid/shortcut/leader-key", service.GetLeaderKey) // get shortcut leader key

	view.GET("/hid/mode", service.GetHidMode) // get hid mode
	view.GET("/hid/leds", service.GetKeyboardLedStatus)

	system.POST("/hid/mode", service.SetHidMode) // set hid mode
	system.POST("/hid/reset", service.ResetHid)  // reset hid
	system.POST("/hid/shortcut", service.AddShortcut)
	system.DELETE("/hid/shortcut", service.DeleteShortcut)
	system.POST("/hid/shortcut/leader-key", service.SetLeaderKey)

	localAPI.POST("/usb/recover", service.RecoverUSB)
}

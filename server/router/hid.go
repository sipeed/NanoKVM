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

	// Operator and admin may send inputs (paste, shortcuts, read/use keyboard)
	opAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin, middleware.RoleOperator),
	)

	opAPI.POST("/hid/paste", service.Paste) // paste

	opAPI.GET("/hid/shortcuts", service.GetShortcuts)     // get shortcuts
	opAPI.POST("/hid/shortcut", service.AddShortcut)      // add shortcut
	opAPI.DELETE("/hid/shortcut", service.DeleteShortcut) // delete shortcut

	opAPI.GET("/hid/shortcut/leader-key", service.GetLeaderKey)  // get shortcut leader key
	opAPI.POST("/hid/shortcut/leader-key", service.SetLeaderKey) // set shortcut leader key

	opAPI.GET("/hid/mode", service.GetHidMode) // get hid mode

	// Admin only: HID hardware configuration
	adminAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin),
	)
	adminAPI.POST("/hid/mode", service.SetHidMode) // set hid mode
	adminAPI.POST("/hid/reset", service.ResetHid)  // reset hid

	// Internal loopback (for kvm_system / picoclaw): no JWT, only loopback token
	localAPI := r.Group("/api/internal").Use(middleware.CheckLoopbackInternalToken())
	localAPI.POST("/usb/recover", service.RecoverUSB)
}

package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/hid"
)

func hidRouter(r *gin.Engine) {
	service := hid.NewService()

	// Operator and admin may send inputs
	opAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin, middleware.RoleOperator),
	)

	opAPI.POST("/hid/paste", service.Paste)

	opAPI.GET("/hid/shortcuts", service.GetShortcuts)
	opAPI.POST("/hid/shortcut", service.AddShortcut)
	opAPI.DELETE("/hid/shortcut", service.DeleteShortcut)

	opAPI.GET("/hid/shortcut/leader-key", service.GetLeaderKey)
	opAPI.POST("/hid/shortcut/leader-key", service.SetLeaderKey)

	opAPI.GET("/hid/mode", service.GetHidMode)

	// Admin only: HID hardware configuration
	adminAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin),
	)
	adminAPI.POST("/hid/mode", service.SetHidMode)
	adminAPI.POST("/hid/reset", service.ResetHid)
}

package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/auth"
)

func authRouter(r *gin.Engine) {
	service := auth.NewService()

	// Public – no token required
	r.POST("/api/auth/login", service.Login)

	// Any authenticated user
	api := r.Group("/api").Use(middleware.CheckToken())
	api.GET("/auth/password", service.IsPasswordUpdated)
	api.POST("/auth/password", service.ChangePassword)
	api.GET("/auth/account", service.GetAccount)
	api.POST("/auth/logout", service.Logout)

	// Any authenticated user may change their own password;
	// admin may change any user's password (enforced inside handler).
	api.POST("/auth/users/:username/password", service.ChangeUserPassword)

	// Admin-only: full user management
	adminAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin),
	)
	adminAPI.GET("/auth/users", service.ListUsers)
	adminAPI.POST("/auth/users", service.CreateUser)
	adminAPI.PUT("/auth/users/:username", service.UpdateUser)
	adminAPI.DELETE("/auth/users/:username", service.DeleteUser)

	// Admin-only: read the audit log (who did what) and toggle it on/off
	adminAPI.GET("/auth/audit", service.GetAuditLog)
	adminAPI.DELETE("/auth/audit/logs", service.ClearAuditLog)
	adminAPI.GET("/auth/audit/config", service.GetAuditConfig)
	adminAPI.POST("/auth/audit/config", service.SetAuditConfig)
}

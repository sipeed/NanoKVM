package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/picoclaw"
)

func picoclawRouter(r *gin.Engine) {
	service := picoclaw.NewService()
	api := r.Group("/api/picoclaw").Use(middleware.CheckTokenOrLocalhost())
	wsAPI := r.Group("/api/picoclaw").Use(middleware.CheckToken())

	api.GET("/screenshot", service.Screenshot)
	api.POST("/actions", service.Actions)
	api.POST("/mcp", service.MCPHandler)
	api.POST("/model/config", service.UpdateModelConfig)
	api.POST("/agent/profile", service.UpdateAgentProfile)
	api.POST("/load-image", service.LoadImage)
	api.GET("/sessions", service.ListSessions)
	api.GET("/sessions/:id", service.GetSession)
	api.DELETE("/sessions/:id", service.DeleteSession)
	api.GET("/runtime/status", service.GetRuntimeStatus)
	api.GET("/runtime/session", service.GetRuntimeSession)
	api.DELETE("/runtime/session", service.ReleaseRuntimeSession)
	api.POST("/runtime/install", service.InstallRuntime)
	api.POST("/runtime/uninstall", service.UninstallRuntime)
	api.POST("/runtime/start", service.StartRuntime)
	api.POST("/runtime/stop", service.StopRuntime)
	wsAPI.GET("/gateway/ws", service.ConnectGateway)
}

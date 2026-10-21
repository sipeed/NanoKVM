package router

import (
	"net/http"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/auth"
	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"
	mcpservice "NanoKVM-Server/service/mcp"
	"NanoKVM-Server/service/mcp/capture/kvm"
	"NanoKVM-Server/service/picoclaw"

	"github.com/gin-gonic/gin"
)

func mcpRouter(r *gin.Engine, control *controlmode.Manager, picoclawService *picoclaw.Service) {
	service := mcpservice.NewServiceWithPreempt(
		control,
		picoclawService.PreemptControlLeasesForMCP,
		picoclawService.StopRuntimeForMCP,
		hid.ReleaseAllHIDStateBestEffort,
		func(status controlmode.Status) {
			picoclawService.PublishControlModeChangedFrom(status, "mcp_config")
		},
	)
	auth.APIKeyRotator = mcpservice.RotateAPIKey

	management := r.Group("/api/mcp").Use(
		middleware.CheckToken(),
		middleware.RequirePermission(authn.PermMcp),
	)
	management.GET("/config", service.GetConfig)
	management.POST("/config", service.SetConfig)
	management.POST("/key/regenerate", service.RegenerateAPIKey)

	handler := mcpservice.NewMCPHandler(control, kvmcapture.New())
	handler = http.NewCrossOriginProtection().Handler(handler)
	r.Any("/api/mcp", mcpservice.APIKeyMiddleware(control), gin.WrapH(handler))
}

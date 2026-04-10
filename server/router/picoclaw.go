package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/picoclaw"
)

const (
	picoclawBasePath             = "/api/picoclaw"
	picoclawModelConfigPath      = "/model/config"
	picoclawAgentProfilePath     = "/agent/profile"
	picoclawSessionsPath         = "/sessions"
	picoclawSessionByIDPath      = "/sessions/:id"
	picoclawRuntimeStatusPath    = "/runtime/status"
	picoclawRuntimeSessionPath   = "/runtime/session"
	picoclawRuntimeInstallPath   = "/runtime/install"
	picoclawRuntimeUninstallPath = "/runtime/uninstall"
	picoclawRuntimeStartPath     = "/runtime/start"
	picoclawRuntimeStopPath      = "/runtime/stop"
	picoclawGatewayWSPath        = "/gateway/ws"
	picoclawScreenshotPath       = "/screenshot"
	picoclawActionsPath          = "/actions"
	picoclawMCPPath              = "/mcp"
	picoclawLoadImagePath        = "/load-image"
)

var picoclawLoopbackHTTPAllowedPaths = []string{
	picoclawBasePath + picoclawMCPPath,
	picoclawBasePath + picoclawRuntimeSessionPath,
	picoclawBasePath + picoclawScreenshotPath,
	picoclawBasePath + picoclawActionsPath,
	picoclawBasePath + picoclawLoadImagePath,
}

func PicoclawLoopbackHTTPAllowedPaths() []string {
	return append([]string(nil), picoclawLoopbackHTTPAllowedPaths...)
}

func picoclawRouter(r *gin.Engine) {
	service := picoclaw.NewService()
	frontendAPI := r.Group(picoclawBasePath).Use(middleware.CheckToken())
	localAPI := r.Group(picoclawBasePath).Use(middleware.CheckLoopbackInternalToken())

	localAPI.GET(picoclawScreenshotPath, service.Screenshot)
	localAPI.POST(picoclawActionsPath, service.Actions)
	localAPI.POST(picoclawMCPPath, service.MCPHandler)
	localAPI.POST(picoclawLoadImagePath, service.LoadImage)
	localAPI.GET(picoclawRuntimeSessionPath, service.GetRuntimeSession)

	frontendAPI.POST(picoclawModelConfigPath, service.UpdateModelConfig)
	frontendAPI.POST(picoclawAgentProfilePath, service.UpdateAgentProfile)
	frontendAPI.GET(picoclawSessionsPath, service.ListSessions)
	frontendAPI.GET(picoclawSessionByIDPath, service.GetSession)
	frontendAPI.DELETE(picoclawSessionByIDPath, service.DeleteSession)
	frontendAPI.GET(picoclawRuntimeStatusPath, service.GetRuntimeStatus)
	frontendAPI.DELETE(picoclawRuntimeSessionPath, service.ReleaseRuntimeSession)
	frontendAPI.POST(picoclawRuntimeInstallPath, service.InstallRuntime)
	frontendAPI.POST(picoclawRuntimeUninstallPath, service.UninstallRuntime)
	frontendAPI.POST(picoclawRuntimeStartPath, service.StartRuntime)
	frontendAPI.POST(picoclawRuntimeStopPath, service.StopRuntime)
	frontendAPI.GET(picoclawGatewayWSPath, service.ConnectGateway)
}

package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/picoclaw"
)

const (
	picoclawBasePath             = "/api/picoclaw"
	picoclawModelConfigPath      = "/model/config"
	picoclawModelTestPath        = "/model/test"
	picoclawAuthStatusPath       = "/auth/status"
	picoclawAuthLoginPath        = "/auth/login"
	picoclawAuthLogoutPath       = "/auth/logout"
	picoclawAuthCallbackPath     = "/auth/callback"
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

	frontendAPI.GET(picoclawModelConfigPath, service.GetModelConfig)
	frontendAPI.POST(picoclawModelConfigPath, service.UpdateModelConfig)
	frontendAPI.POST(picoclawModelTestPath, service.TestModel)
	frontendAPI.GET(picoclawAuthStatusPath, service.GetAuthStatus)
	frontendAPI.POST(picoclawAuthLoginPath, service.StartAuthLogin)
	frontendAPI.POST(picoclawAuthLogoutPath, service.AuthLogout)
	frontendAPI.POST(picoclawAuthCallbackPath, service.AuthCallback)
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

package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/network"
)

func networkRouter(r *gin.Engine) {
	service := network.NewService()

	r.POST("/api/network/wifi", service.ConnectWifi) // connect Wi-Fi

	api := r.Group("/api").Use(middleware.CheckToken())

	api.POST("/network/wol", service.WakeOnLAN)       // wake on lan
	api.GET("/network/wol/mac", service.GetMac)       // get mac list
	api.DELETE("/network/wol/mac", service.DeleteMac) // delete mac

	api.POST("/network/tailscale/install", service.TsInstall)     // install tailscale
	api.POST("/network/tailscale/uninstall", service.TsUninstall) // uninstall tailscale
	api.GET("/network/tailscale/status", service.GetTsStatus)     // get tailscale status
	api.POST("/network/tailscale/up", service.TsUp)               // run tailscale up
	api.POST("/network/tailscale/down", service.TsDown)           // run tailscale down
	api.POST("/network/tailscale/login", service.TsLogin)         // tailscale login
	api.POST("/network/tailscale/logout", service.TsLogout)       // tailscale logout
	api.POST("/network/tailscale/stop", service.TsStop)           // tailscale stop
	api.POST("/network/tailscale/restart", service.TsRestart)     // tailscale restart

	api.GET("/network/wifi", service.GetWifi) // get Wi-Fi information
}

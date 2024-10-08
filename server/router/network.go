package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/network"
	"github.com/gin-gonic/gin"
)

func networkRouter(r *gin.Engine) {
	service := network.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.POST("/network/wol", service.WakeOnLAN)       // wake on lan
	api.GET("/network/wol/mac", service.GetMac)       // get mac list
	api.DELETE("/network/wol/mac", service.DeleteMac) // delete mac

	api.POST("/network/tailscale/install", service.InstallTailscale)     // install tailscale
	api.GET("/network/tailscale/status", service.GetTailscaleStatus)     // get tailscale status
	api.POST("/network/tailscale/status", service.UpdateTailscaleStatus) // update tailscale status
	api.POST("/network/tailscale/login", service.LoginTailscale)         // tailscale login
	api.POST("/network/tailscale/logout", service.LogoutTailscale)       // tailscale logout
}

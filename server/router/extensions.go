package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/extensions/netbird"
	"NanoKVM-Server/service/extensions/tailscale"
	vpnService "NanoKVM-Server/service/extensions/vpn"

	"github.com/gin-gonic/gin"
)

func extensionsRouter(r *gin.Engine) {
	api := r.Group("/api/extensions").Use(middleware.CheckToken())

	ts := tailscale.NewService()

	api.POST("/tailscale/install", ts.Install)     // install tailscale
	api.POST("/tailscale/uninstall", ts.Uninstall) // uninstall tailscale
	api.GET("/tailscale/status", ts.GetStatus)     // get tailscale status
	api.POST("/tailscale/up", ts.Up)               // run tailscale up
	api.POST("/tailscale/down", ts.Down)           // run tailscale down
	api.POST("/tailscale/login", ts.Login)         // tailscale login
	api.POST("/tailscale/logout", ts.Logout)       // tailscale logout
	api.POST("/tailscale/start", ts.Start)         // tailscale start
	api.POST("/tailscale/stop", ts.Stop)           // tailscale stop
	api.POST("/tailscale/restart", ts.Restart)     // tailscale restart

	nb := netbird.NewService()

	api.POST("/netbird/install", nb.Install)     // install netbird
	api.POST("/netbird/uninstall", nb.Uninstall) // uninstall netbird
	api.GET("/netbird/status", nb.GetStatus)     // get netbird status
	api.POST("/netbird/down", nb.Down)           // run netbird down
	api.POST("/netbird/login", nb.Login)         // netbird login
	api.POST("/netbird/start", nb.Start)         // netbird start
	api.POST("/netbird/stop", nb.Stop)           // netbird stop
	api.POST("/netbird/restart", nb.Restart)     // netbird restart

	vpn := vpnService.NewService()
	api.GET("/vpn/preference", vpn.GetPreference)  // get VPN autostart preference
	api.POST("/vpn/preference", vpn.SetPreference) // set VPN autostart preference
}

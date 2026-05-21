package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/network"
)

func networkRouter(r *gin.Engine) {
	service := network.NewService()

	// Unauthenticated endpoints (only meaningful in AP/setup mode)
	r.POST("/api/network/wifi", service.ConnectWifiNoAuth)    // connect Wi-Fi without auth (only available in ap mode)
	r.POST("/api/network/wifi/verify", service.VerifyApLogin) // verify ap login

	// Operator and admin: read network state, perform Wake-on-LAN
	opAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin, middleware.RoleOperator),
	)
	opAPI.POST("/network/wol", service.WakeOnLAN) // wake on lan
	opAPI.GET("/network/wol/mac", service.GetMac) // get mac list
	opAPI.GET("/network/wifi", service.GetWifi)   // get Wi-Fi information
	opAPI.GET("/network/dns", service.GetDNS)     // get DNS configuration

	// Admin only: network configuration
	adminAPI := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequireRole(middleware.RoleAdmin),
	)
	adminAPI.DELETE("/network/wol/mac", service.DeleteMac)            // delete mac
	adminAPI.POST("/network/wol/mac/name", service.SetMacName)        // set mac name
	adminAPI.POST("/network/wifi/connect", service.ConnectWifi)       // connect Wi-Fi
	adminAPI.POST("/network/wifi/disconnect", service.DisconnectWifi) // disconnect Wi-Fi
	adminAPI.POST("/network/dns", service.SetDNS)                     // set DNS configuration
}

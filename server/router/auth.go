package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/auth"
)

func authRouter(r *gin.Engine) {
	service := auth.NewService()

	r.POST("/api/auth/login", service.Login)      // login
	r.POST("/api/auth/wifi", service.ConnectWifi) // connect Wi-Fi

	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/auth/password", service.IsPasswordUpdated) // is password updated
	api.POST("/auth/password", service.ChangePassword)   // change password
}

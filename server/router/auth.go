package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/auth"
	"github.com/gin-gonic/gin"
)

func authRouter(r *gin.Engine) {
	service := auth.NewService()

	r.POST("/api/auth/login", service.Login) // login

	api := r.Group("/api").Use(middleware.CheckToken())

	api.POST("/auth/password", service.ChangePassword) // change password
}

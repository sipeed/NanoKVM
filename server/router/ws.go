package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/ws"
	"github.com/gin-gonic/gin"
)

func wsRouter(r *gin.Engine) {
	service := ws.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/ws", service.Connect)
}

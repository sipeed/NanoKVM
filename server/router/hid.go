package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/hid"
	"github.com/gin-gonic/gin"
)

func hidRouter(r *gin.Engine) {
	service := hid.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.POST("/hid/reset", service.Reset) // reset hid
	api.POST("/hid/paste", service.Paste) // paste
}

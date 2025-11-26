package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/application"

	"github.com/gin-gonic/gin"
)

func applicationRouter(r *gin.Engine) {
	service := application.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/application/version", service.GetVersion) // get application version
	api.POST("/application/update", service.Update)     // update application

	api.GET("/application/preview", service.GetPreview)  // get preview updates state
	api.POST("/application/preview", service.SetPreview) // set preview updates state
}

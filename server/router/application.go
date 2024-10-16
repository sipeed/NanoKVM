package router

import (
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/application"
)

func applicationRouter(r *gin.Engine) {
	log.Debugf("application router init")
	service := application.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/application/version", service.GetVersion) // get application version
	api.POST("/application/update", service.Update)     // update application
	api.GET("/application/lib", service.GetLib)         // check if lib exists
	api.POST("/application/lib", service.UpdateLib)     // update lib
	log.Debugf("application router init done")
}

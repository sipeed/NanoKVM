package router

import (
	"NanoKVM-Server/authn"
	"NanoKVM-Server/service/download"
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
)

func downloadRouter(r *gin.Engine) {
	service := download.NewService()
	api := r.Group("/api").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))

	api.POST("/download/image", service.DownloadImage)              // download image
	api.POST("/download/image/cancel", service.CancelDownloadImage) // cancel image download
	api.GET("/download/image/status", service.StatusImage)          // download image
	api.GET("/download/image/enabled", service.ImageEnabled)        // download image
	api.POST("/download/file", service.DownloadImageFile)           // download image
}

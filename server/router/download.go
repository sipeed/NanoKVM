package router

import (
	"NanoKVM-Server/authn"
	"NanoKVM-Server/service/download"
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
)

func downloadRouter(r *gin.Engine) {
	service := download.NewService()
	manage := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermMediaManage))
	// Progress and availability are reads: a user who may mount media can take
	// /data away from the downloader, so they need to see whether one is running.
	read := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequirePermission(authn.PermMediaMount, authn.PermMediaManage),
	)

	manage.POST("/download/image", service.DownloadImage)              // download image
	manage.POST("/download/image/cancel", service.CancelDownloadImage) // cancel image download
	read.GET("/download/image/status", service.StatusImage)            // download image
	read.GET("/download/image/enabled", service.ImageEnabled)          // download image
	manage.POST("/download/file", service.DownloadImageFile)           // download image
}

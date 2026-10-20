package router

import (
	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/download"

	"github.com/gin-gonic/gin"
)

func downloadRouter(r *gin.Engine) {
	service := download.NewService()
	// A signed URL that ends up on the data partition changes what this device
	// keeps, so it follows the library write grant.
	write := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermLibraryWrite))
	// Progress and availability are reads: a user who may attach a medium can
	// take /data away from the downloader, so they need to see whether one is
	// running, and reading the library is implied by every media grant.
	read := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermLibraryRead))

	write.POST("/download/image", service.DownloadImage)              // download image
	write.POST("/download/image/cancel", service.CancelDownloadImage) // cancel image download
	read.GET("/download/image/status", service.StatusImage)           // download image
	read.GET("/download/image/enabled", service.ImageEnabled)         // download image
	write.POST("/download/file", service.DownloadImageFile)           // upload image file
}

package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/storage"
)

func storageRouter(r *gin.Engine) {
	service := storage.NewService()
	api := r.Group("/api").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))

	// Virtual media: the disk images the emulated USB disk exposes, and the
	// files inside them.
	api.GET("/storage/media", service.GetMedia)               // list media
	api.GET("/storage/media/state", service.GetMediaState)    // what the target machine sees
	api.GET("/storage/media/status", service.GetMediaStatus)  // transfer progress
	api.POST("/storage/media/delete", service.DeleteMedia)    // delete a medium
	api.POST("/storage/media/mount", service.MountMedia)      // attach a medium to the target machine
	api.POST("/storage/media/eject", service.EjectMedia)      // release the medium
	api.GET("/storage/media/download", service.DownloadMedia) // download a whole image
	api.GET("/storage/media/files", service.ListMediaFiles)   // list files inside a medium
	api.GET("/storage/media/files/download", service.DownloadMediaFile)
	api.POST("/storage/media/files/upload", service.UploadMediaFile)
	api.POST("/storage/media/files/delete", service.DeleteMediaFile)

	// The pre-2.6 image API, kept for scripts written against it.
	api.GET("/storage/image", service.GetImages)               // get image list
	api.GET("/storage/image/mounted", service.GetMountedImage) // get mounted image
	api.POST("/storage/image/mount", service.MountImage)       // mount image
	api.GET("/storage/cdrom", service.GetCdRom)                // get CD-ROM flag
	api.POST("/storage/image/delete", service.DeleteImage)     // delete image
}

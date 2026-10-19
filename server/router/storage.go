package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/storage"
)

func storageRouter(r *gin.Engine) {
	service := storage.NewService()
	mount := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermMediaMount))
	manage := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermMediaManage))
	read := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermMediaMount, authn.PermMediaManage))

	// Virtual media: the disk images the emulated USB disk exposes, and the
	// files inside them. Inspecting the library is allowed for both media
	// roles (managing requires seeing the contents); attaching it to the
	// target machine is media.mount; changing library contents is media.manage.
	read.GET("/storage/media", service.GetMedia)               // list media
	read.GET("/storage/media/state", service.GetMediaState)    // what the target machine sees
	read.GET("/storage/media/status", service.GetMediaStatus)  // transfer progress
	read.GET("/storage/media/download", service.DownloadMedia) // download a whole image
	read.GET("/storage/media/files", service.ListMediaFiles)   // list files inside a medium
	read.GET("/storage/media/files/download", service.DownloadMediaFile)
	mount.POST("/storage/media/mount", service.MountMedia)    // attach a medium to the target machine
	mount.POST("/storage/media/eject", service.EjectMedia)    // release the medium
	manage.POST("/storage/media/delete", service.DeleteMedia) // delete a medium
	manage.POST("/storage/media/files/upload", service.UploadMediaFile)
	manage.POST("/storage/media/files/delete", service.DeleteMediaFile)

	// The pre-2.6 image API, kept for scripts written against it.
	read.GET("/storage/image", service.GetImages)               // get image list
	read.GET("/storage/image/mounted", service.GetMountedImage) // get mounted image
	read.GET("/storage/cdrom", service.GetCdRom)                // get CD-ROM flag
	mount.POST("/storage/image/mount", service.MountImage)      // mount image
	manage.POST("/storage/image/delete", service.DeleteImage)   // delete image
}

package router

import (
	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/storage"

	"github.com/gin-gonic/gin"
)

func storageRouter(r *gin.Engine) {
	service := storage.NewService()
	// Reading the library is the one grant the other media grants imply, so it
	// alone gates every read: it is what makes the storage page reachable.
	read := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermLibraryRead))
	// Attaching a medium is what hands it to the target machine; changing the
	// library is what changes what this device keeps.
	attach := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermMediumAttach))
	write := r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(authn.PermLibraryWrite))
	// The file handlers serve an image and the shared partition through the same
	// path: the first is library content, the second is the surface the target
	// machine reads. Which grant applies follows the medium in the request, so
	// the route admits either and the handler narrows the pair.
	files := r.Group("/api").Use(
		middleware.CheckToken(),
		middleware.RequirePermission(authn.PermLibraryWrite, authn.PermMediumAttach),
	)

	// Virtual media: the disk images the emulated USB disk exposes, the files
	// inside them, and the shared partition the target machine sees.
	read.GET("/storage/media", service.GetMedia)               // list media
	read.GET("/storage/media/state", service.GetMediaState)    // what the target machine sees
	read.GET("/storage/media/status", service.GetMediaStatus)  // transfer progress
	read.GET("/storage/media/download", service.DownloadMedia) // download a whole image
	read.GET("/storage/media/files", service.ListMediaFiles)   // list files inside a medium
	read.GET("/storage/media/files/download", service.DownloadMediaFile)
	attach.POST("/storage/media/mount", service.MountMedia)  // attach a medium to the target machine
	attach.POST("/storage/media/eject", service.EjectMedia)  // release the medium
	write.POST("/storage/media/delete", service.DeleteMedia) // delete a medium
	files.POST("/storage/media/files/upload", service.UploadMediaFile)
	files.POST("/storage/media/files/delete", service.DeleteMediaFile)

	// The pre-2.6 image API, kept for scripts written against it.
	read.GET("/storage/image", service.GetImages)               // get image list
	read.GET("/storage/image/mounted", service.GetMountedImage) // get mounted image
	read.GET("/storage/cdrom", service.GetCdRom)                // get CD-ROM flag
	attach.POST("/storage/image/mount", service.MountImage)     // mount image
	write.POST("/storage/image/delete", service.DeleteImage)    // delete image
}

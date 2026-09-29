package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/stream/direct"
	"NanoKVM-Server/service/stream/mjpeg"
	"NanoKVM-Server/service/stream/webrtc"

	"github.com/gin-gonic/gin"
)

func streamRouter(r *gin.Engine) {
	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/stream/mjpeg", mjpeg.Connect)                      // mjpeg stream
	api.POST("/stream/mjpeg/detect", mjpeg.UpdateFrameDetect)    // update frame detect
	api.POST("/stream/mjpeg/detect/stop", mjpeg.StopFrameDetect) // temporary stop frame detect

	api.GET("/stream/video", webrtc.Connect)             // configurable video stream (webrtc)
	api.GET("/stream/video/direct", direct.Connect)      // configurable video stream (direct)
	api.GET("/stream/h264", webrtc.ConnectLegacy)        // legacy h264 stream (webrtc)
	api.GET("/stream/h264/direct", direct.ConnectLegacy) // legacy h264 stream (direct)
}

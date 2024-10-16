package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/stream"
)

func streamRouter(r *gin.Engine) {
	service := stream.NewService()
	api := r.Group("/api").Use(middleware.CheckToken())

	api.GET("/stream/mjpeg", service.Mjpeg) // mjpeg stream

	api.GET("/stream/mjpeg/detect", service.GetFrameDetect)        // get frame detect state
	api.POST("/stream/mjpeg/detect", service.UpdateFrameDetect)    // update frame detect state
	api.POST("/stream/mjpeg/detect/stop", service.StopFrameDetect) // temporary stop frame detect
}

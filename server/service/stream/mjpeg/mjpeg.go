package mjpeg

import (
	"time"

	"github.com/gin-gonic/gin"
)

var streamer = NewStreamer()

func Connect(c *gin.Context) {
	c.Header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Pragma", "no-cache")
	c.Header("X-Server-Date", time.Now().Format(time.RFC1123))

	streamer.AddClient(c)
	defer streamer.RemoveClient(c)

	<-c.Request.Context().Done()
}

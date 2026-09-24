package mjpeg

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var streamer = NewStreamer()

type LatestFrame struct {
	Data       []byte
	Width      uint16
	Height     uint16
	CapturedAt time.Time
}

func Connect(c *gin.Context) {
	c.Header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Pragma", "no-cache")
	c.Header("X-Server-Date", time.Now().Format(time.RFC1123))

	client := streamer.AddClient(c)
	defer streamer.RemoveClient(client)
	controller := newResponseController(c.Writer)

	for {
		data, ok := client.next()
		if !ok {
			return
		}

		if err := writeFrame(c, controller, data); err != nil {
			log.Errorf("failed to write mjpeg frame for client %s: %s", c.Request.RemoteAddr, err)
			return
		}
	}
}

func newResponseController(writer http.ResponseWriter) *http.ResponseController {
	if unwrapper, ok := writer.(interface{ Unwrap() http.ResponseWriter }); ok {
		writer = unwrapper.Unwrap()
	}

	return http.NewResponseController(writer)
}

func GetLatestFrame() (LatestFrame, bool) {
	return streamer.getLatestFrame()
}

func EnableLatestFrameCache() {
	streamer.enableLatestFrameCache()
}

func DisableLatestFrameCache() {
	streamer.disableLatestFrameCache()
}

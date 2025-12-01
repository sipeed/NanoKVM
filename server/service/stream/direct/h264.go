package direct

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

var (
	streamer = newStreamer()
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func Connect(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to upgrade to websocket: %s", err)
		return
	}
	defer func() {
		_ = ws.Close()
		log.Debugf("h264 websocket disconnected: %s", ws.RemoteAddr())
	}()
	log.Debugf("h264 websocket connected: %s", ws.RemoteAddr())

	_ = ws.SetReadDeadline(time.Time{})

	streamer.addClient(ws)
	defer streamer.removeClient(ws)

	for {
		if _, _, err := ws.ReadMessage(); err != nil {
			log.Debugf("failed to read message (client disconnected): %s", err)
			return
		}
	}
}

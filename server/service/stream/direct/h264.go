package direct

import (
	"NanoKVM-Server/service/stream"
	"strconv"
	"time"

	"NanoKVM-Server/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const pongWait = 30 * time.Second

var (
	streamer = newStreamer()
	upgrader = websocket.Upgrader{
		WriteBufferSize: 256 * 1024,
		CheckOrigin:     middleware.SameOrigin,
	}
)

func Connect(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to upgrade to websocket: %s", err)
		return
	}
	client := newClient(ws)
	if flowWindow, err := strconv.Atoi(c.Query("flow")); err == nil && flowWindow > 0 {
		client.queue.enableFlowControl(flowWindow)
	}
	defer func() {
		streamer.removeClient(client)
		client.close()
		client.wait()
		log.Debugf("h264 websocket disconnected: %s", ws.RemoteAddr())
	}()
	log.Debugf("h264 websocket connected: %s", ws.RemoteAddr())

	ws.SetReadLimit(64)
	_ = ws.SetReadDeadline(time.Now().Add(pongWait))
	ws.SetPongHandler(func(string) error {
		return ws.SetReadDeadline(time.Now().Add(pongWait))
	})

	streamer.addClient(client)

	unregisterMode := stream.RegisterH264Mode(stream.H264ModeDirect)
	defer unregisterMode()

	for {
		messageType, data, err := ws.ReadMessage()
		if err != nil {
			log.Debugf("failed to read message (client disconnected): %s", err)
			return
		}
		_ = ws.SetReadDeadline(time.Now().Add(pongWait))
		client.handleControl(messageType, data)
	}
}

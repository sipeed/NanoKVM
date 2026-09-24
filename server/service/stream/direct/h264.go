package direct

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/stream"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const pongWait = 30 * time.Second

var (
	streamer = newStreamer()
	upgrader = websocket.Upgrader{
		WriteBufferSize: 256 * 1024,
		CheckOrigin:     middleware.CheckWebSocketOrigin,
	}
)

func Connect(c *gin.Context) {
	config, err := stream.ParseEncoderConfig(c.Request.URL.Query(), stream.DefaultEncoderConfig())
	if err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	connect(c, config)
}

func ConnectLegacy(c *gin.Context) {
	connect(c, stream.LegacyEncoderConfig())
}

func connect(c *gin.Context, config stream.EncoderConfig) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to upgrade to websocket: %s", err)
		return
	}
	stopSessionWatcher := middleware.WatchWebSocket(c.Request.Context(), ws)
	defer stopSessionWatcher()
	client := newClient(ws)
	if flowWindow, err := strconv.Atoi(c.Query("flow")); err == nil && flowWindow > 0 {
		client.queue.enableFlowControl(flowWindow)
	}
	ws.SetReadLimit(64)
	_ = ws.SetReadDeadline(time.Now().Add(pongWait))
	ws.SetPongHandler(func(string) error {
		return ws.SetReadDeadline(time.Now().Add(pongWait))
	})

	if err := streamer.addClient(client, config); err != nil {
		message := websocket.FormatCloseMessage(websocket.ClosePolicyViolation, err.Error())
		_ = ws.WriteControl(websocket.CloseMessage, message, time.Now().Add(time.Second))
		client.close()
		return
	}
	defer func() {
		streamer.removeClient(client)
		client.close()
		client.wait()
		log.Debugf("direct video websocket disconnected: %s", ws.RemoteAddr())
	}()
	log.Debugf("direct video websocket connected: %s", ws.RemoteAddr())

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

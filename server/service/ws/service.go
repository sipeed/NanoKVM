package ws

import (
	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     middleware.CheckWebSocketOrigin,
}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Connect(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("create websocket failed: %s", err)
		return
	}
	stopSessionWatcher := middleware.WatchWebSocket(c.Request.Context(), ws)
	defer stopSessionWatcher()

	log.Debug("websocket connected")

	// View-only sessions keep receiving frames but their keyboard and mouse
	// reports are dropped.
	readOnly := true
	username := ""
	if principal, ok := middleware.CurrentPrincipal(c); ok {
		readOnly = !principal.Has(authn.PermConsoleControl)
		username = principal.Username
	}

	client := NewClient(ws, readOnly, username)

	manager := GetManager()
	manager.AddClient(ws, client)
	defer manager.RemoveClient(ws)

	sendCaptureStatusSnapshot(client)
	sendH264ModeStatusSnapshot(client)
	sendKeyboardLedStatusSnapshot(client)

	client.Start()
}

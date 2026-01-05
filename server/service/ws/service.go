package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

type Service struct{}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
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

	log.Debug("websocket connected")

	client := NewClient(ws)

	manager := GetManager()
	manager.AddClient(ws, client)
	defer manager.RemoveClient(ws)

	client.Start()
}

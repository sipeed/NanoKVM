package ws

import (
	"NanoKVM-Server/service/hid"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
	"net/http"
	"time"
)

const (
	KeyboardEvent int = 1
	MouseEvent    int = 2
)

type WsClient struct {
	conn     *websocket.Conn
	keyboard chan []int
	mouse    chan []int
	watcher  chan struct{}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (s *Service) Connect(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("create websocket failed: %s", err)
		return
	}
	log.Debug("websocket connected")

	client := &WsClient{
		conn:     conn,
		keyboard: make(chan []int, 200),
		mouse:    make(chan []int, 200),
		watcher:  make(chan struct{}, 1),
	}

	go client.Start()
}

func (c *WsClient) Start() {
	defer c.Clean()

	hid.Open()

	go hid.Keyboard(c.keyboard)
	go hid.Mouse(c.mouse)

	go c.Watch()

	_ = c.Read()
}

func (c *WsClient) Read() error {
	var zeroTime time.Time
	_ = c.conn.SetReadDeadline(zeroTime)

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			return err
		}

		log.Debugf("receive message: %s", message)

		var event []int
		err = json.Unmarshal(message, &event)
		if err != nil {
			log.Debugf("receive invalid message: %s", message)
			continue
		}

		if event[0] == KeyboardEvent {
			c.keyboard <- event[1:]
		} else if event[0] == MouseEvent {
			c.mouse <- event[1:]
		}
	}
}

func (c *WsClient) Write(message []byte) error {
	_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.conn.WriteMessage(websocket.TextMessage, message)
}

func (c *WsClient) Watch() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	var fileModMap = map[string]time.Time{
		StreamState: time.Unix(0, 0),
	}

	for {
		select {
		case <-ticker.C:
			{
				message, err := watchStreamState(fileModMap)
				if err != nil || message == nil {
					continue
				}

				err = c.Write(message)
				if err != nil {
					return
				}
			}

		case <-c.watcher:
			return
		}
	}
}

func (c *WsClient) Clean() {
	_ = c.conn.Close()

	go clearQueue(c.keyboard)
	close(c.keyboard)

	go clearQueue(c.mouse)
	close(c.mouse)

	close(c.watcher)

	hid.Close()

	log.Debug("websocket disconnected")
}

func clearQueue(queue chan []int) {
	for range queue {
	}
}

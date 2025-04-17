package ws

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/vm/jiggler"
)

const (
	KeyboardEvent int = 1
	MouseEvent    int = 2
)

type WsClient struct {
	conn     *websocket.Conn
	hid      *hid.Hid
	keyboard chan []int
	mouse    chan []int
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
		hid:      hid.GetHid(),
		conn:     conn,
		keyboard: make(chan []int, 200),
		mouse:    make(chan []int, 200),
	}

	go client.Start()
}

func (c *WsClient) Start() {
	defer c.Clean()

	c.hid.Open()

	go c.hid.Keyboard(c.keyboard)
	go c.hid.Mouse(c.mouse)

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

		log.Debugf("received message: %s", message)

		var event []int
		err = json.Unmarshal(message, &event)
		if err != nil {
			log.Debugf("received invalid message: %s", message)
			continue
		}

		if event[0] == KeyboardEvent {
			c.keyboard <- event[1:]
		} else if event[0] == MouseEvent {
			c.mouse <- event[1:]
		}

		// update latest HID operation time
		jiggler.GetJiggler().Update()
	}
}

func (c *WsClient) Write(message []byte) error {
	_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.conn.WriteMessage(websocket.TextMessage, message)
}

func (c *WsClient) Clean() {
	_ = c.conn.Close()

	go clearQueue(c.keyboard)
	close(c.keyboard)

	go clearQueue(c.mouse)
	close(c.mouse)

	c.hid.Close()

	log.Debug("websocket disconnected")
}

func clearQueue(queue chan []int) {
	for range queue {
	}
}

package ws

import (
	"encoding/json"
	"time"

	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/vm/jiggler"

	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const (
	Heartbeat = iota
	KeyboardEvent
	MouseEvent
)

func NewClient(ws *websocket.Conn) *Client {
	client := &Client{
		ws:            ws,
		hid:           hid.GetHid(),
		keyboard:      make(chan []byte, 200),
		mouse:         make(chan []byte, 200),
		lastHeartbeat: time.Time{},
	}

	client.hid.Open()

	return client
}

func (c *Client) Start() {
	defer c.Close()

	go c.hid.Keyboard(c.keyboard)
	go c.hid.Mouse(c.mouse)

	_ = c.Read()
}

func (c *Client) Read() error {
	var zeroTime time.Time
	_ = c.ws.SetReadDeadline(zeroTime)

	for {
		messageType, data, err := c.ws.ReadMessage()
		if err != nil {
			return err
		}

		log.Debugf("received message %d: %v", messageType, data)

		switch data[0] {
		case Heartbeat:
			c.UpdateHeartbeat()
		case KeyboardEvent:
			writeQueue(c.keyboard, data[1:])
		case MouseEvent:
			writeQueue(c.mouse, data[1:])
		}
	}
}

func (c *Client) Write(event string, data string) error {
	message := &Message{
		Type: event,
		Data: data,
	}

	messageByte, err := json.Marshal(message)
	if err != nil {
		log.Errorf("failed to marshal message: %s", err)
		return err
	}

	c.mutex.Lock()
	defer c.mutex.Unlock()

	_ = c.ws.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.ws.WriteMessage(websocket.TextMessage, messageByte)
}

func (c *Client) UpdateHeartbeat() {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.lastHeartbeat = time.Now()
}

func (c *Client) Close() {
	_ = c.ws.Close()

	closeQueue(c.keyboard)
	closeQueue(c.mouse)

	log.Debug("websocket disconnected")
}

func writeQueue(queue chan []byte, data []byte) {
	queue <- data
	jiggler.GetJiggler().Update()
}

func closeQueue(queue chan []byte) {
	for range queue {
	}
	close(queue)
}

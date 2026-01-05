package ws

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"NanoKVM-Server/service/hid"
)

type Manager struct {
	clients map[*websocket.Conn]*Client
	mutex   sync.RWMutex
}

type Client struct {
	ws            *websocket.Conn
	hid           *hid.Hid
	keyboard      chan []byte
	mouse         chan []byte
	lastHeartbeat time.Time
	mutex         sync.Mutex
}

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

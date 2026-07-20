package ws

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/inputcontrol"
)

type Manager struct {
	clients map[*websocket.Conn]*Client
	mutex   sync.RWMutex
}

type Client struct {
	ws               *websocket.Conn
	hid              *hid.Hid
	manual           *inputcontrol.ManualSession
	keyboard         chan hid.QueuedReport
	mouse            chan hid.QueuedReport
	heartbeatTimeout time.Duration
	lastHeartbeat    time.Time
	mutex            sync.Mutex
	closeOnce        sync.Once
	workers          sync.WaitGroup
}

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

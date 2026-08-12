package webrtc

import (
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
	"github.com/pion/rtp"
	"github.com/pion/webrtc/v4"
)

type WebRTCManager struct {
	clients        map[*websocket.Conn]*Client
	clientSnapshot atomic.Pointer[[]*Client]
	videoSending   bool
	mutex          sync.Mutex
	viewerVersion  uint64
}

type Client struct {
	ws    *websocket.Conn
	video *webrtc.PeerConnection
	track *Track
	mutex sync.Mutex
}

func (c *Client) WsConn() *websocket.Conn {
	return c.ws
}

type SignalingHandler struct {
	client         *Client
	mutex          sync.Mutex
	unregisterMode func()
	closed         bool
}

type Track struct {
	playoutDelayExtensionID   uint8
	playoutDelayExtensionData []byte
	videoPacketizer           rtp.Packetizer
	video                     *webrtc.TrackLocalStaticRTP
}

type Message struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

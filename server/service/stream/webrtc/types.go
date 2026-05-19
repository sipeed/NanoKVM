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
	videoSending   int32
	mutex          sync.Mutex
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
	client *Client
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

package webrtc

import (
	"NanoKVM-Server/service/stream"
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

type WebRTCManager struct {
	clients        map[*websocket.Conn]*Client
	clientSnapshot atomic.Pointer[[]*Client]
	config         stream.EncoderConfig
	subscription   *stream.VideoSubscription
	videoSending   bool
	mutex          sync.Mutex
	viewerVersion  uint64
}

type Client struct {
	ws     *websocket.Conn
	video  *webrtc.PeerConnection
	track  *Track
	config stream.EncoderConfig
	mutex  sync.Mutex
}

func (c *Client) WsConn() *websocket.Conn {
	return c.ws
}

type SignalingHandler struct {
	client *Client
	mutex  sync.Mutex
	closed bool
}

type Track struct {
	video *webrtc.TrackLocalStaticRTP
}

type Message struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

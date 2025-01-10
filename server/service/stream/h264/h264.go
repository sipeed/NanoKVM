package h264

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	log "github.com/sirupsen/logrus"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	trackMap  = make(map[*websocket.Conn]*webrtc.TrackLocalStaticSample)
	mutex     = sync.RWMutex{}
	isSending = false
	exitSig   = make(chan bool, 1)
)

func Connect(c *gin.Context) {
	wsConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to create websocket: %s", err)
		return
	}

	defer func() {
		_ = wsConn.Close()
		log.Debugf("h264 websocket disconnected")
	}()

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{
					"stun:stun.l.google.com:19302",
					"stun:turn.cloudflare.com:3478",
				},
			},
		},
	}

	peerConn, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Errorf("failed to create PeerConnection: %s", err)
		return
	}

	defer func() {
		_ = peerConn.Close()
		log.Debugf("PeerConnection disconnected")
	}()

	client := &Client{
		ws: wsConn,
		pc: peerConn,
	}

	client.addTrack()
	client.register()
	client.readMessage()
}

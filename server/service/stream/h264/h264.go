package h264

import (
	"NanoKVM-Server/config"
	"net/http"
	"sync"
	"time"

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
	isSending = false
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

	var zeroTime time.Time
	_ = wsConn.SetReadDeadline(zeroTime)

	conf := config.GetInstance()

	var iceServers []webrtc.ICEServer

	if conf.Stun != "" && conf.Stun != "disable" {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs: []string{"stun:" + conf.Stun},
		})
	}

	if conf.Turn.TurnAddr != "" && conf.Turn.TurnUser != "" && conf.Turn.TurnCred != "" {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs:       []string{"turn:" + conf.Turn.TurnAddr},
			Username:   conf.Turn.TurnUser,
			Credential: conf.Turn.TurnCred,
		})
	}

	peerConn, err := webrtc.NewPeerConnection(webrtc.Configuration{
		ICEServers: iceServers,
	})
	if err != nil {
		log.Errorf("failed to create PeerConnection: %s", err)
		return
	}

	defer func() {
		_ = peerConn.Close()
		log.Debugf("PeerConnection disconnected")
	}()

	client := &Client{
		ws:    wsConn,
		pc:    peerConn,
		mutex: sync.Mutex{},
	}

	client.addTrack()
	client.register()
	client.readMessage()
}

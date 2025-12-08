package webrtc

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4/pkg/media"
	log "github.com/sirupsen/logrus"
)

func NewWebRTCManager() *WebRTCManager {
	return &WebRTCManager{
		clients:      make(map[*websocket.Conn]*Client),
		videoSending: 0,
		mutex:        sync.RWMutex{},
	}
}

func (m *WebRTCManager) AddClient(ws *websocket.Conn, client *Client) {
	client.track.updateExtension()

	m.mutex.Lock()
	m.clients[ws] = client
	m.mutex.Unlock()

	log.Debugf("added client %s, total clients: %d", ws.RemoteAddr(), len(m.clients))
}

func (m *WebRTCManager) RemoveClient(ws *websocket.Conn) {
	m.mutex.Lock()
	delete(m.clients, ws)
	m.mutex.Unlock()

	log.Debugf("removed client %s, total clients: %d", ws.RemoteAddr(), len(m.clients))
}

func (m *WebRTCManager) GetClientCount() int {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	return len(m.clients)
}

func (m *WebRTCManager) StartVideoStream() {
	if atomic.CompareAndSwapInt32(&m.videoSending, 0, 1) {
		go m.sendVideoStream()
		log.Debugf("start sending h264 stream")
	}
}

func (m *WebRTCManager) sendVideoStream() {
	defer atomic.StoreInt32(&m.videoSending, 0)

	screen := common.GetScreen()
	common.CheckScreen()
	fps := screen.FPS
	duration := time.Second / time.Duration(fps)

	vision := common.GetKvmVision()

	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	for range ticker.C {
		if m.GetClientCount() == 0 {
			log.Debugf("stop sending h264 stream")
			return
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		if result < 0 || len(data) == 0 {
			continue
		}

		sample := media.Sample{
			Data:     data,
			Duration: duration,
		}

		for _, client := range m.clients {
			client.track.writeVideo(sample)
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			duration = time.Second / time.Duration(fps)
			ticker.Reset(duration)
		}

		stream.GetFrameRateCounter().Update()
	}
}

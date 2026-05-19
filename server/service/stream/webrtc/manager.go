package webrtc

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4/pkg/media"
	log "github.com/sirupsen/logrus"
)

func NewWebRTCManager() *WebRTCManager {
	m := &WebRTCManager{
		clients:      make(map[*websocket.Conn]*Client),
		videoSending: 0,
	}
	m.updateClientSnapshotLocked()

	return m
}

func (m *WebRTCManager) AddClient(ws *websocket.Conn, client *Client) {
	client.track.updateExtension()

	m.mutex.Lock()
	m.clients[ws] = client
	count := m.updateClientSnapshotLocked()
	m.mutex.Unlock()

	log.Debugf("added client %s, total clients: %d", ws.RemoteAddr(), count)
}

func (m *WebRTCManager) RemoveClient(ws *websocket.Conn) {
	m.mutex.Lock()
	delete(m.clients, ws)
	count := m.updateClientSnapshotLocked()
	m.mutex.Unlock()

	log.Debugf("removed client %s, total clients: %d", ws.RemoteAddr(), count)
}

func (m *WebRTCManager) GetClientCount() int {
	return len(m.getClients())
}

func (m *WebRTCManager) updateClientSnapshotLocked() int {
	clients := make([]*Client, 0, len(m.clients))
	for _, client := range m.clients {
		clients = append(clients, client)
	}
	m.clientSnapshot.Store(&clients)

	return len(clients)
}

func (m *WebRTCManager) getClients() []*Client {
	clients := m.clientSnapshot.Load()
	if clients == nil {
		return nil
	}

	return *clients
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
		clients := m.getClients()
		if len(clients) == 0 {
			log.Debugf("stop sending h264 stream")
			return
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		stream.UpdateCaptureStatus(stream.CaptureModeH264, result)
		if result < 0 || len(data) == 0 {
			continue
		}

		sample := media.Sample{
			Data:     data,
			Duration: duration,
		}

		for _, client := range clients {
			if err := client.track.writeVideoSample(sample); err != nil {
				log.Errorf("failed to write h264 video to client: %s", err)
				m.RemoveClient(client.WsConn())
				client.Close()
			}
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			duration = time.Second / time.Duration(fps)
			ticker.Reset(duration)
		}

		stream.GetFrameRateCounter().Update()
	}
}

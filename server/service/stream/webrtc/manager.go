package webrtc

import (
	"NanoKVM-Server/service/stream"
	"NanoKVM-Server/service/vm"

	"github.com/gorilla/websocket"
	"github.com/pion/rtp"
	"github.com/pion/rtp/codecs"
	"github.com/pion/webrtc/v4/pkg/media"
	log "github.com/sirupsen/logrus"
)

func NewWebRTCManager() *WebRTCManager {
	m := &WebRTCManager{
		clients: make(map[*websocket.Conn]*Client),
		videoPacketizer: rtp.NewPacketizer(
			1450,
			100,
			0x1234ABCD,
			&codecs.H264Payloader{},
			rtp.NewRandomSequencer(),
			90000,
		),
		videoSending: false,
	}
	m.updateClientSnapshotLocked()

	return m
}

func (m *WebRTCManager) AddClient(ws *websocket.Conn, client *Client) {
	m.mutex.Lock()
	m.clients[ws] = client
	count := m.updateClientSnapshotLocked()
	m.viewerVersion++
	version := m.viewerVersion
	m.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("webrtc", count, version)

	log.Debugf("added client %s, total clients: %d", ws.RemoteAddr(), count)
}

func (m *WebRTCManager) RemoveClient(ws *websocket.Conn) {
	m.mutex.Lock()
	delete(m.clients, ws)
	count := m.updateClientSnapshotLocked()
	m.viewerVersion++
	version := m.viewerVersion
	m.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("webrtc", count, version)

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
	m.mutex.Lock()
	if m.videoSending || len(m.clients) == 0 {
		m.mutex.Unlock()
		return
	}
	m.videoSending = true
	m.mutex.Unlock()

	go m.sendVideoStream()
	log.Debugf("start sending h264 stream")
}

func (m *WebRTCManager) stopVideoStreamIfIdle() bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if len(m.clients) > 0 {
		return false
	}

	m.videoSending = false
	return true
}

func (m *WebRTCManager) sendVideoStream() {
	subscription := stream.SubscribeH264()
	defer subscription.Close()
	samples, writerDone := m.startVideoWriter()

	for {
		frame, ok := subscription.Next()
		if !ok {
			close(samples)
			<-writerDone
			return
		}
		clients := m.getClients()
		if len(clients) == 0 {
			close(samples)
			<-writerDone
			if m.stopVideoStreamIfIdle() {
				log.Debugf("stop sending h264 stream")
				return
			}
			samples, writerDone = m.startVideoWriter()

			continue
		}

		stream.UpdateCaptureStatus(stream.CaptureModeH264, frame.Result)
		if frame.Result < 0 || len(frame.Data) == 0 {
			continue
		}

		sample := media.Sample{
			Data:     frame.Data,
			Duration: frame.Duration,
		}

		samples <- sample
	}
}

func (m *WebRTCManager) startVideoWriter() (chan media.Sample, <-chan struct{}) {
	samples := make(chan media.Sample, 1)
	done := make(chan struct{})

	go func() {
		defer close(done)
		for sample := range samples {
			packets := m.videoPacketizer.Packetize(sample.Data, uint32(sample.Duration.Seconds()*90000))
			for _, client := range m.getClients() {
				err := client.track.writeVideoPackets(packets)
				if err != nil {
					log.Errorf("failed to write h264 video to client: %s", err)
					m.RemoveClient(client.WsConn())
					client.Close()
				}
			}
		}
	}()

	return samples, done
}

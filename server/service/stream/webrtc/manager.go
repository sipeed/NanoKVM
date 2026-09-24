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
		clients:      make(map[*websocket.Conn]*Client),
		videoSending: false,
	}
	m.updateClientSnapshotLocked()

	return m
}

func (m *WebRTCManager) AddClient(ws *websocket.Conn, client *Client) error {
	m.mutex.Lock()
	if _, exists := m.clients[ws]; exists {
		m.mutex.Unlock()
		return nil
	}
	if len(m.clients) > 0 && m.config != client.config {
		active := m.config
		m.mutex.Unlock()
		return &stream.EncoderConfigConflictError{Active: active, Requested: client.config}
	}

	if len(m.clients) == 0 {
		subscription, err := stream.SubscribeVideo(client.config)
		if err != nil {
			m.mutex.Unlock()
			return err
		}
		m.config = client.config
		m.subscription = subscription
	}

	m.clients[ws] = client
	count := m.updateClientSnapshotLocked()
	m.viewerVersion++
	version := m.viewerVersion
	m.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("webrtc", count, version)

	log.Debugf("added client %s, total clients: %d", ws.RemoteAddr(), count)
	return nil
}

func (m *WebRTCManager) RemoveClient(ws *websocket.Conn) {
	m.mutex.Lock()
	if _, exists := m.clients[ws]; !exists {
		m.mutex.Unlock()
		return
	}
	delete(m.clients, ws)
	count := m.updateClientSnapshotLocked()
	m.viewerVersion++
	version := m.viewerVersion
	var subscription *stream.VideoSubscription
	if count == 0 {
		subscription = m.subscription
		m.subscription = nil
		m.config = stream.EncoderConfig{}
		m.videoSending = false
	}
	m.mutex.Unlock()
	if subscription != nil {
		subscription.Close()
	}
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

func (m *WebRTCManager) getClientsFor(subscription *stream.VideoSubscription) []*Client {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	if m.subscription != subscription {
		return nil
	}

	clients := m.clientSnapshot.Load()
	if clients == nil {
		return nil
	}
	return *clients
}

func (m *WebRTCManager) StartVideoStream() {
	m.mutex.Lock()
	if m.videoSending || len(m.clients) == 0 || m.subscription == nil {
		m.mutex.Unlock()
		return
	}
	m.videoSending = true
	subscription := m.subscription
	codec := m.config.Codec
	m.mutex.Unlock()

	go m.sendVideoStream(subscription, newVideoPacketizer(codec))
	log.Debugf("start sending %s WebRTC stream", codec)
}

func (m *WebRTCManager) sendVideoStream(subscription *stream.VideoSubscription, packetizer rtp.Packetizer) {
	samples, writerDone := m.startVideoWriter(subscription, packetizer)

	for {
		frame, ok := subscription.Next()
		if !ok {
			close(samples)
			<-writerDone
			return
		}
		clients := m.getClientsFor(subscription)
		if len(clients) == 0 {
			close(samples)
			<-writerDone
			return
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

func newVideoPacketizer(codec stream.VideoCodec) rtp.Packetizer {
	payloader := rtp.Payloader(&codecs.H264Payloader{})
	if codec == stream.VideoCodecH265 {
		payloader = &codecs.H265Payloader{}
	}
	return rtp.NewPacketizer(
		1200,
		100,
		0x1234ABCD,
		payloader,
		rtp.NewRandomSequencer(),
		90000,
	)
}

func (m *WebRTCManager) startVideoWriter(subscription *stream.VideoSubscription, packetizer rtp.Packetizer) (chan media.Sample, <-chan struct{}) {
	samples := make(chan media.Sample, 1)
	done := make(chan struct{})

	go func() {
		defer close(done)
		for sample := range samples {
			packets := packetizer.Packetize(sample.Data, uint32(sample.Duration.Seconds()*90000))
			for _, client := range m.getClientsFor(subscription) {
				err := client.track.writeVideoPackets(packets)
				if err != nil {
					log.Errorf("failed to write video to client: %s", err)
					m.RemoveClient(client.WsConn())
					client.Close()
				}
			}
		}
	}()

	return samples, done
}

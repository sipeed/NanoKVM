package direct

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"NanoKVM-Server/service/vm"
	"sync"
	"sync/atomic"
	"time"

	log "github.com/sirupsen/logrus"
)

type Streamer struct {
	mutex          sync.Mutex
	clients        map[*client]struct{}
	clientSnapshot atomic.Pointer[[]*client]
	running        bool
	viewerVersion  uint64
}

func newStreamer() *Streamer {
	s := &Streamer{
		clients: make(map[*client]struct{}),
	}
	s.updateClientSnapshotLocked()

	return s
}

func (s *Streamer) addClient(client *client) {
	client.start()

	s.mutex.Lock()
	s.clients[client] = struct{}{}
	count := s.updateClientSnapshotLocked()
	s.viewerVersion++
	version := s.viewerVersion
	start := !s.running
	if start {
		s.running = true
	}
	s.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("direct", count, version)

	if start {
		go s.run()
		log.Debug("h264 stream started")
	}
}

func (s *Streamer) removeClient(client *client) {
	s.mutex.Lock()
	if _, exists := s.clients[client]; !exists {
		s.mutex.Unlock()
		return
	}

	delete(s.clients, client)
	count := s.updateClientSnapshotLocked()
	s.viewerVersion++
	version := s.viewerVersion
	s.mutex.Unlock()
	client.close()
	vm.UpdateHdmiViewerSnapshot("direct", count, version)

	log.Debugf("h264 websocket disconnected, remaining clients: %d", count)
}

func (s *Streamer) updateClientSnapshotLocked() int {
	clients := make([]*client, 0, len(s.clients))
	for client := range s.clients {
		clients = append(clients, client)
	}
	s.clientSnapshot.Store(&clients)

	return len(clients)
}

func (s *Streamer) getClients() []*client {
	clients := s.clientSnapshot.Load()
	if clients == nil {
		return nil
	}

	return *clients
}

func (s *Streamer) run() {
	screen := common.GetScreen()
	common.CheckScreen()
	fps := screen.FPS

	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	vision := common.GetKvmVision()
	startTime := time.Now()

	for range ticker.C {
		clients := s.getClients()
		if len(clients) == 0 {
			if s.stopIfIdle() {
				log.Debug("h264 stream stopped due to no clients")
				return
			}
			continue
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			ticker.Reset(time.Second / time.Duration(fps))
		}

		if !hasCaptureDemand(clients) {
			continue
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		stream.UpdateCaptureStatus(stream.CaptureModeDirect, result)
		if result < 0 || len(data) == 0 {
			continue
		}

		timestamp := time.Since(startTime).Microseconds()
		frame := newOutboundFrame(result == 3, timestamp, data)
		for _, client := range clients {
			client.offer(frame)
		}

		stream.GetFrameRateCounter().Update()
	}
}

func (s *Streamer) stopIfIdle() bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if len(s.clients) > 0 {
		return false
	}

	s.running = false
	return true
}

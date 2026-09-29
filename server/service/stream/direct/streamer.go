package direct

import (
	"NanoKVM-Server/service/stream"
	"NanoKVM-Server/service/vm"
	"sync"
	"sync/atomic"

	log "github.com/sirupsen/logrus"
)

type Streamer struct {
	mutex          sync.Mutex
	clients        map[*client]struct{}
	clientSnapshot atomic.Pointer[[]*client]
	config         stream.EncoderConfig
	subscription   *stream.VideoSubscription
	viewerVersion  uint64
}

func newStreamer() *Streamer {
	s := &Streamer{
		clients: make(map[*client]struct{}),
	}
	s.updateClientSnapshotLocked()

	return s
}

func (s *Streamer) addClient(client *client, config stream.EncoderConfig) error {
	s.mutex.Lock()
	if len(s.clients) > 0 && s.config != config {
		active := s.config
		s.mutex.Unlock()
		return &stream.EncoderConfigConflictError{Active: active, Requested: config}
	}

	var subscription *stream.VideoSubscription
	if len(s.clients) == 0 {
		var err error
		subscription, err = stream.SubscribeVideo(config)
		if err != nil {
			s.mutex.Unlock()
			return err
		}
		s.config = config
		s.subscription = subscription
	}

	s.clients[client] = struct{}{}
	count := s.updateClientSnapshotLocked()
	s.viewerVersion++
	version := s.viewerVersion
	s.mutex.Unlock()
	client.start()
	vm.UpdateHdmiViewerSnapshot("direct", count, version)

	if subscription != nil {
		go s.run(subscription)
		log.Debugf("direct video stream started with %+v", config)
	}
	return nil
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
	var subscription *stream.VideoSubscription
	if count == 0 {
		subscription = s.subscription
		s.subscription = nil
		s.config = stream.EncoderConfig{}
	}
	s.mutex.Unlock()
	client.close()
	if subscription != nil {
		subscription.Close()
	}
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

func (s *Streamer) getClientsFor(subscription *stream.VideoSubscription) []*client {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if s.subscription != subscription {
		return nil
	}

	clients := s.clientSnapshot.Load()
	if clients == nil {
		return nil
	}
	return *clients
}

func (s *Streamer) run(subscription *stream.VideoSubscription) {
	for {
		frame, ok := subscription.Next()
		if !ok {
			return
		}
		clients := s.getClientsFor(subscription)
		if len(clients) == 0 {
			return
		}

		if !hasCaptureDemand(clients) {
			// The shared source has already advanced.  A client whose entire
			// flow-control window is in flight cannot safely resume on the next
			// delta frame because that frame may reference the one skipped here.
			// Preserve its acknowledgements, discard queued deltas, and resume
			// only at the next independently decodable keyframe.
			for _, client := range clients {
				client.markDiscontinuity()
			}
			continue
		}

		stream.UpdateCaptureStatus(stream.CaptureModeDirect, frame.Result)
		if frame.Result < 0 || len(frame.Data) == 0 {
			continue
		}

		outbound := newOutboundFrame(frame.Result == 3, frame.Timestamp, frame.Storage, frame.Data)
		for _, client := range clients {
			client.offer(outbound)
		}
	}
}

package stream

import (
	"sync"

	"github.com/google/uuid"
)

const (
	H264ModeStatusEvent = "h264-mode-status"
	H264ModeDirect      = "direct"
	H264ModeWebRTC      = "webrtc"
)

type H264ModeStatus struct {
	Generation string `json:"generation"`
	Revision   uint64 `json:"revision"`
	Direct     int    `json:"direct"`
	WebRTC     int    `json:"webrtc"`
	Mixed      bool   `json:"mixed"`
}

type H264ModeStatusSubscriber func(H264ModeStatus)

var defaultH264ModeStore = newH264ModeStore()

func RegisterH264Mode(mode string) func() {
	return defaultH264ModeStore.register(mode)
}

func SubscribeH264ModeStatus(subscriber H264ModeStatusSubscriber) func() {
	return defaultH264ModeStore.subscribe(subscriber)
}

func CurrentH264ModeStatus() H264ModeStatus {
	return defaultH264ModeStore.current()
}

type h264ModeStore struct {
	mutex       sync.Mutex
	counts      map[string]int
	status      H264ModeStatus
	subscribers map[int]H264ModeStatusSubscriber
	nextID      int
	pending     []h264ModeStatusNotification
	notify      chan struct{}
}

type h264ModeStatusNotification struct {
	status      H264ModeStatus
	subscribers []H264ModeStatusSubscriber
}

func newH264ModeStore() *h264ModeStore {
	store := &h264ModeStore{
		counts:      make(map[string]int),
		subscribers: make(map[int]H264ModeStatusSubscriber),
		status: H264ModeStatus{
			Generation: uuid.NewString(),
		},
		notify: make(chan struct{}, 1),
	}
	go store.run()

	return store
}

func (s *h264ModeStore) register(mode string) func() {
	if !isH264Mode(mode) {
		return func() {}
	}

	s.update(mode, 1)

	var once sync.Once
	return func() {
		once.Do(func() {
			s.update(mode, -1)
		})
	}
}

func (s *h264ModeStore) subscribe(subscriber H264ModeStatusSubscriber) func() {
	s.mutex.Lock()
	id := s.nextID
	s.nextID++
	s.subscribers[id] = subscriber
	s.mutex.Unlock()

	return func() {
		s.mutex.Lock()
		delete(s.subscribers, id)
		s.mutex.Unlock()
	}
}

func (s *h264ModeStore) current() H264ModeStatus {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.status
}

func (s *h264ModeStore) update(mode string, delta int) {
	s.mutex.Lock()
	previous := s.status
	s.counts[mode] += delta
	if s.counts[mode] < 0 {
		s.counts[mode] = 0
	}

	next := H264ModeStatus{
		Generation: previous.Generation,
		Revision:   previous.Revision + 1,
		Direct:     s.counts[H264ModeDirect],
		WebRTC:     s.counts[H264ModeWebRTC],
	}
	next.Mixed = next.Direct > 0 && next.WebRTC > 0
	s.status = next

	if previous.Mixed == next.Mixed {
		s.mutex.Unlock()
		return
	}

	subscribers := make([]H264ModeStatusSubscriber, 0, len(s.subscribers))
	for _, subscriber := range s.subscribers {
		subscribers = append(subscribers, subscriber)
	}
	s.pending = append(s.pending, h264ModeStatusNotification{
		status:      next,
		subscribers: subscribers,
	})
	s.mutex.Unlock()

	select {
	case s.notify <- struct{}{}:
	default:
	}
}

func (s *h264ModeStore) run() {
	for range s.notify {
		for {
			notification, ok := s.takePending()
			if !ok {
				break
			}

			for _, subscriber := range notification.subscribers {
				subscriber(notification.status)
			}
		}
	}
}

func (s *h264ModeStore) takePending() (h264ModeStatusNotification, bool) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if len(s.pending) == 0 {
		return h264ModeStatusNotification{}, false
	}

	notification := s.pending[0]
	s.pending = s.pending[1:]
	return notification, true
}

func isH264Mode(mode string) bool {
	return mode == H264ModeDirect || mode == H264ModeWebRTC
}

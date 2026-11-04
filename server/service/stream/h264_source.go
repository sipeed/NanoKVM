package stream

import (
	"NanoKVM-Server/common"
	"sync"
	"time"
)

type H264Frame struct {
	Data      []byte
	Result    int
	Timestamp int64
}

type H264Subscription struct {
	source *H264Source
	frames chan H264Frame
	done   chan struct{}
	once   sync.Once
}

type H264Source struct {
	mutex       sync.Mutex
	subscribers map[*H264Subscription]struct{}
	running     bool
}

var defaultH264Source = &H264Source{
	subscribers: make(map[*H264Subscription]struct{}),
}

func SubscribeH264() *H264Subscription {
	return defaultH264Source.subscribe()
}

func (s *H264Source) subscribe() *H264Subscription {
	subscription := &H264Subscription{
		source: s,
		frames: make(chan H264Frame),
		done:   make(chan struct{}),
	}

	s.mutex.Lock()
	s.subscribers[subscription] = struct{}{}
	start := !s.running
	if start {
		s.running = true
	}
	s.mutex.Unlock()

	if start {
		go s.run()
	}

	return subscription
}

func (s *H264Subscription) Next() (H264Frame, bool) {
	select {
	case <-s.done:
		return H264Frame{}, false
	default:
	}

	select {
	case frame := <-s.frames:
		return frame, true
	case <-s.done:
		return H264Frame{}, false
	}
}

func (s *H264Subscription) Close() {
	s.once.Do(func() {
		close(s.done)
		s.source.remove(s)
	})
}

func (s *H264Source) remove(subscription *H264Subscription) {
	s.mutex.Lock()
	delete(s.subscribers, subscription)
	s.mutex.Unlock()
}

func (s *H264Source) run() {
	screen := common.GetScreen()
	common.CheckScreen()
	vision := common.GetKvmVision()
	s.capture(screen, vision.AcquireH264, vision.StopH264)
}

func (s *H264Source) capture(screen *common.Screen, acquire func(uint16, uint16, uint16, uint16) *common.VideoFrame, stop func()) {
	for {
		subscribers := s.snapshot()
		if len(subscribers) == 0 {
			s.mutex.Lock()
			if len(s.subscribers) == 0 {
				if stop != nil {
					stop()
				}
				s.running = false
				s.mutex.Unlock()
				return
			}
			s.mutex.Unlock()
			continue
		}

		current := acquire(0, 0, screen.BitRate, uint16(screen.FPS))
		frame := H264Frame{
			Data:      current.Data,
			Result:    current.Result,
			Timestamp: current.Timestamp,
		}
		for _, subscription := range subscribers {
			subscription.send(frame)
		}
		current.Release()
		if frame.Result >= 0 && len(frame.Data) > 0 {
			GetFrameRateCounter().Update()
		} else {
			time.Sleep(time.Second / time.Duration(max(screen.FPS, 1)))
		}
	}
}

func (s *H264Source) snapshot() []*H264Subscription {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	subscribers := make([]*H264Subscription, 0, len(s.subscribers))
	for subscription := range s.subscribers {
		subscribers = append(subscribers, subscription)
	}
	return subscribers
}

func (s *H264Subscription) send(frame H264Frame) bool {
	select {
	case <-s.done:
		return false
	default:
	}
	select {
	case s.frames <- frame:
		return true
	case <-s.done:
		return false
	}
}

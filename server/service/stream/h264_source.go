package stream

import (
	"NanoKVM-Server/common"
	"sync"
	"sync/atomic"
	"time"
)

type H264Frame struct {
	Data      []byte
	Result    int
	Duration  time.Duration
	Timestamp int64
}

type H264Subscription struct {
	frames chan H264Frame
	done   chan struct{}
	closed atomic.Bool
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
		frames: make(chan H264Frame, 4),
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
	case frame := <-s.frames:
		return frame, true
	case <-s.done:
		return H264Frame{}, false
	}
}

func (s *H264Subscription) Close() {
	s.once.Do(func() {
		s.closed.Store(true)
		close(s.done)
		defaultH264Source.remove(s)
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
	fps := screen.FPS
	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	vision := common.GetKvmVision()
	startTime := time.Now()

	for range ticker.C {
		subscribers := s.snapshot()
		if len(subscribers) == 0 {
			s.mutex.Lock()
			if len(s.subscribers) == 0 {
				s.running = false
				s.mutex.Unlock()
				return
			}
			s.mutex.Unlock()
			continue
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			ticker.Reset(time.Second / time.Duration(fps))
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		if result < 0 {
			frame := H264Frame{Result: result}
			for _, subscription := range subscribers {
				subscription.send(frame)
			}
			continue
		}
		if len(data) == 0 {
			continue
		}

		frame := H264Frame{
			Data:      data,
			Result:    result,
			Duration:  time.Second / time.Duration(fps),
			Timestamp: time.Since(startTime).Microseconds(),
		}
		for _, subscription := range subscribers {
			subscription.send(frame)
		}
		GetFrameRateCounter().Update()
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
	if s.closed.Load() {
		return false
	}

	select {
	case s.frames <- frame:
		return true
	case <-s.done:
		return false
	}
}

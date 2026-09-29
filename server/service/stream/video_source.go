package stream

import (
	"NanoKVM-Server/common"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

const keyFrameResult = 3

type VideoFrame struct {
	Storage   []byte
	Data      []byte
	Result    int
	Duration  time.Duration
	Timestamp int64
}

type VideoSubscription struct {
	source             *VideoSource
	session            *videoSession
	frames             chan VideoFrame
	done               chan struct{}
	closed             atomic.Bool
	once               sync.Once
	waitingForKeyframe bool
}

type videoSession struct {
	config EncoderConfig
	stop   chan struct{}
	done   chan struct{}
}

type VideoSource struct {
	mutex        sync.Mutex
	subscribers  map[*VideoSubscription]struct{}
	session      *videoSession
	captureFrame func(EncoderConfig) ([]byte, []byte, int)
}

type EncoderConfigConflictError struct {
	Active    EncoderConfig
	Requested EncoderConfig
}

func (e *EncoderConfigConflictError) Error() string {
	return fmt.Sprintf("video encoder is already in use with %+v; requested %+v", e.Active, e.Requested)
}

var defaultVideoSource = newVideoSource(captureVideoFrame)

func newVideoSource(captureFrame func(EncoderConfig) ([]byte, []byte, int)) *VideoSource {
	return &VideoSource{
		subscribers:  make(map[*VideoSubscription]struct{}),
		captureFrame: captureFrame,
	}
}

func SubscribeVideo(config EncoderConfig) (*VideoSubscription, error) {
	return defaultVideoSource.subscribe(config)
}

func (s *VideoSource) subscribe(config EncoderConfig) (*VideoSubscription, error) {
	for {
		s.mutex.Lock()
		if s.session != nil && len(s.subscribers) == 0 {
			// The last subscriber has gone, but its capture goroutine may still
			// be returning from a native frame read.  Do not let a replacement
			// profile interleave with that stale session.
			done := s.session.done
			s.mutex.Unlock()
			<-done
			continue
		}
		if s.session != nil && s.session.config != config {
			active := s.session.config
			s.mutex.Unlock()
			return nil, &EncoderConfigConflictError{Active: active, Requested: config}
		}

		start := s.session == nil
		if start {
			s.session = &videoSession{
				config: config,
				stop:   make(chan struct{}),
				done:   make(chan struct{}),
			}
		}
		session := s.session
		subscription := &VideoSubscription{
			source:  s,
			session: session,
			frames:  make(chan VideoFrame, 4),
			done:    make(chan struct{}),
		}
		s.subscribers[subscription] = struct{}{}
		s.mutex.Unlock()

		if start {
			go s.run(session)
		}

		return subscription, nil
	}
}

func (s *VideoSubscription) Next() (VideoFrame, bool) {
	select {
	case frame := <-s.frames:
		return frame, true
	case <-s.done:
		return VideoFrame{}, false
	}
}

func (s *VideoSubscription) Close() {
	s.once.Do(func() {
		s.closed.Store(true)
		close(s.done)
		s.source.remove(s)
	})
}

func (s *VideoSource) remove(subscription *VideoSubscription) {
	s.mutex.Lock()
	delete(s.subscribers, subscription)
	if len(s.subscribers) == 0 && s.session == subscription.session {
		close(subscription.session.stop)
	}
	s.mutex.Unlock()
}

func (s *VideoSource) run(session *videoSession) {
	defer func() {
		s.mutex.Lock()
		if s.session == session {
			s.session = nil
		}
		close(session.done)
		s.mutex.Unlock()
	}()

	screen := common.GetScreen()
	common.CheckScreen()
	fps := normalizedFPS(screen.FPS)
	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	startTime := time.Now()
	for {
		select {
		case <-session.stop:
			return
		case <-ticker.C:
		}

		if nextFPS := normalizedFPS(screen.FPS); nextFPS != fps {
			fps = nextFPS
			ticker.Reset(time.Second / time.Duration(fps))
		}

		storage, data, result := s.captureFrame(session.config)
		frame := VideoFrame{Result: result}
		if result >= 0 {
			if len(data) == 0 {
				continue
			}
			frame.Storage = storage
			frame.Data = data
			frame.Duration = time.Second / time.Duration(fps)
			frame.Timestamp = time.Since(startTime).Microseconds()
		}

		for _, subscription := range s.snapshot(session) {
			subscription.send(frame)
		}
		if result >= 0 {
			GetFrameRateCounter().Update()
		}
	}
}

func normalizedFPS(fps int) int {
	if fps < 1 {
		return 30
	}
	return fps
}

func captureVideoFrame(config EncoderConfig) ([]byte, []byte, int) {
	screen := common.GetScreen()
	return common.GetKvmVision().ReadVideoWithHeadroom(
		screen.Width,
		screen.Height,
		uint8(config.Codec.NativeCodec()),
		screen.BitRate,
		screen.GOP,
		uint8(normalizedFPS(screen.FPS)),
		9,
	)
}

func (s *VideoSource) snapshot(session *videoSession) []*VideoSubscription {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	subscribers := make([]*VideoSubscription, 0, len(s.subscribers))
	for subscription := range s.subscribers {
		if subscription.session == session {
			subscribers = append(subscribers, subscription)
		}
	}
	return subscribers
}

func (s *VideoSubscription) send(frame VideoFrame) bool {
	if s.closed.Load() {
		return false
	}
	if s.waitingForKeyframe {
		if frame.Result != keyFrameResult {
			return false
		}
		s.waitingForKeyframe = false
	}

	select {
	case s.frames <- frame:
		return true
	case <-s.done:
		return false
	default:
	}

	for {
		select {
		case <-s.frames:
		case <-s.done:
			return false
		default:
			s.waitingForKeyframe = true
			if frame.Result != keyFrameResult {
				return false
			}
			s.waitingForKeyframe = false
			select {
			case s.frames <- frame:
				return true
			case <-s.done:
				return false
			}
		}
	}
}

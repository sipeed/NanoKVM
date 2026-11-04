package mjpeg

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"NanoKVM-Server/service/vm"
	"bytes"
	"fmt"
	"image/jpeg"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var crlf = []byte("\r\n")

type Streamer struct {
	mutex          sync.Mutex
	clients        map[*gin.Context]bool
	clientSnapshot atomic.Pointer[[]*gin.Context]
	running        int32
	frameMutex     sync.RWMutex
	latestFrame    LatestFrame
	cacheRefs      int32
	viewerVersion  uint64
}

func NewStreamer() *Streamer {
	s := &Streamer{
		clients: make(map[*gin.Context]bool),
	}
	s.updateClientSnapshotLocked()

	return s
}

func (s *Streamer) AddClient(c *gin.Context) {
	s.mutex.Lock()
	s.clients[c] = true
	count := s.updateClientSnapshotLocked()
	s.viewerVersion++
	version := s.viewerVersion
	s.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("mjpeg", count, version)

	if atomic.CompareAndSwapInt32(&s.running, 0, 1) {
		go s.run()
		log.Debug("mjpeg stream started")
	}
}

func (s *Streamer) RemoveClient(c *gin.Context) {
	s.mutex.Lock()
	delete(s.clients, c)
	count := s.updateClientSnapshotLocked()
	s.viewerVersion++
	version := s.viewerVersion
	s.mutex.Unlock()
	vm.UpdateHdmiViewerSnapshot("mjpeg", count, version)

	log.Debugf("mjpeg connection removed, remaining clients: %d", count)
}

func (s *Streamer) updateClientSnapshotLocked() int {
	clients := make([]*gin.Context, 0, len(s.clients))
	for c := range s.clients {
		clients = append(clients, c)
	}
	s.clientSnapshot.Store(&clients)

	return len(clients)
}

func (s *Streamer) getClients() []*gin.Context {
	clients := s.clientSnapshot.Load()
	if clients == nil {
		return nil
	}

	return *clients
}

func (s *Streamer) run() {
	screen := common.GetScreen()
	common.CheckScreen()

	vision := common.GetKvmVision()
	s.streamFrames(screen, vision.AcquireMjpeg, vision.StopMjpeg)
}

func (s *Streamer) streamFrames(screen *common.Screen, acquire func(uint16, uint16, uint16, uint16) *common.VideoFrame, stop func()) {
	frames := make(chan *common.VideoFrame)
	done := make(chan struct{})
	captureDone := make(chan struct{})
	go func() {
		defer close(captureDone)
		defer stop()
		for {
			select {
			case <-done:
				return
			default:
			}
			frame := acquire(0, 0, screen.Quality, uint16(screen.FPS))
			select {
			case frames <- frame:
				frame.Release()
			case <-done:
				frame.Release()
				return
			}
			if frame.Result < 0 {
				select {
				case <-time.After(time.Second / time.Duration(max(screen.FPS, 1))):
				case <-done:
					return
				}
			}
		}
	}()

	for {
		clients := s.getClients()
		if len(clients) == 0 {
			s.mutex.Lock()
			if len(s.clients) == 0 {
				close(done)
				<-captureDone
				atomic.StoreInt32(&s.running, 0)
				s.mutex.Unlock()
				log.Debug("mjpeg stream stopped due to no clients")
				return
			}
			s.mutex.Unlock()
			continue
		}

		frame := <-frames
		data, result := frame.Data, frame.Result
		stream.UpdateCaptureStatus(stream.CaptureModeMJPEG, result)
		if result < 0 || result == 5 || len(data) == 0 {
			continue
		}

		if s.frameCacheEnabled() {
			s.setLatestFrame(data)
		}

		for _, client := range clients {
			if err := writeFrame(client, data); err != nil {
				log.Errorf("failed to write mjpeg frame for client %s: %s", client.Request.RemoteAddr, err)
				s.RemoveClient(client)
			}
		}

		stream.GetFrameRateCounter().Update()
	}
}

func (s *Streamer) setLatestFrame(data []byte) {
	size, err := jpeg.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return
	}
	frameCopy := append([]byte(nil), data...)

	s.frameMutex.Lock()
	defer s.frameMutex.Unlock()

	s.latestFrame = LatestFrame{
		Data:       frameCopy,
		Width:      uint16(size.Width),
		Height:     uint16(size.Height),
		CapturedAt: time.Now(),
	}
}

func (s *Streamer) clearLatestFrame() {
	s.frameMutex.Lock()
	defer s.frameMutex.Unlock()

	s.latestFrame = LatestFrame{}
}

func (s *Streamer) enableLatestFrameCache() {
	atomic.AddInt32(&s.cacheRefs, 1)
}

func (s *Streamer) disableLatestFrameCache() {
	for {
		current := atomic.LoadInt32(&s.cacheRefs)
		if current <= 0 {
			return
		}

		if atomic.CompareAndSwapInt32(&s.cacheRefs, current, current-1) {
			if current == 1 {
				s.clearLatestFrame()
			}
			return
		}
	}
}

func (s *Streamer) frameCacheEnabled() bool {
	return atomic.LoadInt32(&s.cacheRefs) > 0
}

func (s *Streamer) getLatestFrame() (LatestFrame, bool) {
	if !s.frameCacheEnabled() {
		return LatestFrame{}, false
	}

	s.frameMutex.RLock()
	defer s.frameMutex.RUnlock()

	if len(s.latestFrame.Data) == 0 {
		return LatestFrame{}, false
	}

	return LatestFrame{
		Data:       append([]byte(nil), s.latestFrame.Data...),
		Width:      s.latestFrame.Width,
		Height:     s.latestFrame.Height,
		CapturedAt: s.latestFrame.CapturedAt,
	}, true
}

func writeFrame(c *gin.Context, data []byte) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = c.Request.Context().Err()
			if err == nil {
				err = fmt.Errorf("panic recovered in writeFrame: %v", r)
			}
		}
	}()

	header := "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: " + strconv.Itoa(len(data)) + "\r\n\r\n"
	if _, err = c.Writer.WriteString(header); err != nil {
		return err
	}

	if _, err = c.Writer.Write(data); err != nil {
		return err
	}

	if _, err = c.Writer.Write(crlf); err != nil {
		return err
	}

	c.Writer.Flush()
	return nil
}

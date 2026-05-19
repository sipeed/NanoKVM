package mjpeg

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"fmt"
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
	s.updateClientSnapshotLocked()
	s.mutex.Unlock()

	if atomic.CompareAndSwapInt32(&s.running, 0, 1) {
		go s.run()
		log.Debug("mjpeg stream started")
	}
}

func (s *Streamer) RemoveClient(c *gin.Context) {
	s.mutex.Lock()
	delete(s.clients, c)
	count := s.updateClientSnapshotLocked()
	s.mutex.Unlock()

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
	defer atomic.StoreInt32(&s.running, 0)

	screen := common.GetScreen()
	common.CheckScreen()
	fps := screen.FPS

	vision := common.GetKvmVision()

	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	for range ticker.C {
		clients := s.getClients()
		if len(clients) == 0 {
			log.Debug("mjpeg stream stopped due to no clients")
			return
		}

		data, result := vision.ReadMjpeg(screen.Width, screen.Height, screen.Quality)
		stream.UpdateCaptureStatus(stream.CaptureModeMJPEG, result)
		if result < 0 || result == 5 || len(data) == 0 {
			continue
		}

		if s.frameCacheEnabled() {
			s.setLatestFrame(data, screen.Width, screen.Height)
		}

		for _, client := range clients {
			if err := writeFrame(client, data); err != nil {
				log.Errorf("failed to write mjpeg frame for client %s: %s", client.Request.RemoteAddr, err)
				s.RemoveClient(client)
			}
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			ticker.Reset(time.Second / time.Duration(fps))
		}

		stream.GetFrameRateCounter().Update()
	}
}

func (s *Streamer) setLatestFrame(data []byte, width uint16, height uint16) {
	frameCopy := append([]byte(nil), data...)

	s.frameMutex.Lock()
	defer s.frameMutex.Unlock()

	s.latestFrame = LatestFrame{
		Data:       frameCopy,
		Width:      width,
		Height:     height,
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

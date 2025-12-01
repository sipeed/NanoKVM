package direct

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"bytes"
	"encoding/binary"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

type Streamer struct {
	mutex   sync.RWMutex
	clients map[*websocket.Conn]bool
	running int32
}

func newStreamer() *Streamer {
	return &Streamer{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (s *Streamer) addClient(ws *websocket.Conn) {
	s.mutex.Lock()
	s.clients[ws] = true
	s.mutex.Unlock()

	if atomic.CompareAndSwapInt32(&s.running, 0, 1) {
		go s.run()
		log.Debug("h264 stream started")
	}
}

func (s *Streamer) removeClient(ws *websocket.Conn) {
	s.mutex.Lock()
	delete(s.clients, ws)
	s.mutex.Unlock()

	log.Debugf("h264 websocket disconnected, remaining clients: %d", len(s.clients))
}

func (s *Streamer) getClientCount() int {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return len(s.clients)
}

func (s *Streamer) run() {
	defer atomic.StoreInt32(&s.running, 0)

	duration := time.Second / time.Duration(120)
	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	screen := common.GetScreen()
	vision := common.GetKvmVision()
	startTime := time.Now()

	for range ticker.C {
		if s.getClientCount() == 0 {
			log.Debug("h264 stream stopped due to no clients")
			return
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		if result < 0 || len(data) == 0 {
			continue
		}

		isKeyFrame := byte(0)
		if result == 3 {
			isKeyFrame = byte(1)
		}

		timestamp := time.Since(startTime).Microseconds()

		if err := s.send(isKeyFrame, timestamp, data); err != nil {
			continue
		}

		stream.GetFrameRateCounter().Update()
	}
}

func (s *Streamer) send(isKeyFrame byte, timestamp int64, data []byte) error {
	buf := BufferPool.Get().(*bytes.Buffer)
	defer BufferPool.Put(buf)

	buf.Reset()

	if err := buf.WriteByte(isKeyFrame); err != nil {
		log.Errorf("failed to write keyframe flag: %s", err)
		return err
	}

	tsBytes := make([]byte, 8)
	binary.LittleEndian.PutUint64(tsBytes, uint64(timestamp))
	if _, err := buf.Write(tsBytes); err != nil {
		log.Errorf("failed to write timestamp: %s", err)
		return err
	}

	if _, err := buf.Write(data); err != nil {
		log.Errorf("failed to write h264 data: %s", err)
		return err
	}

	for client := range s.clients {
		if err := client.WriteMessage(websocket.BinaryMessage, buf.Bytes()); err != nil {
			log.Errorf("failed to write message to client %s: %s.", client.RemoteAddr(), err)

			s.removeClient(client)
		}
	}

	return nil
}

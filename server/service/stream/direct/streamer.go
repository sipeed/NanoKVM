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
	mutex          sync.Mutex
	clients        map[*websocket.Conn]bool
	clientSnapshot atomic.Pointer[[]*websocket.Conn]
	running        int32
}

func newStreamer() *Streamer {
	s := &Streamer{
		clients: make(map[*websocket.Conn]bool),
	}
	s.updateClientSnapshotLocked()

	return s
}

func (s *Streamer) addClient(ws *websocket.Conn) {
	s.mutex.Lock()
	s.clients[ws] = true
	s.updateClientSnapshotLocked()
	s.mutex.Unlock()

	if atomic.CompareAndSwapInt32(&s.running, 0, 1) {
		go s.run()
		log.Debug("h264 stream started")
	}
}

func (s *Streamer) removeClient(ws *websocket.Conn) {
	s.mutex.Lock()
	delete(s.clients, ws)
	count := s.updateClientSnapshotLocked()
	s.mutex.Unlock()

	log.Debugf("h264 websocket disconnected, remaining clients: %d", count)
}

func (s *Streamer) updateClientSnapshotLocked() int {
	clients := make([]*websocket.Conn, 0, len(s.clients))
	for client := range s.clients {
		clients = append(clients, client)
	}
	s.clientSnapshot.Store(&clients)

	return len(clients)
}

func (s *Streamer) getClients() []*websocket.Conn {
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

	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	vision := common.GetKvmVision()
	startTime := time.Now()

	for range ticker.C {
		clients := s.getClients()
		if len(clients) == 0 {
			log.Debug("h264 stream stopped due to no clients")
			return
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		stream.UpdateCaptureStatus(stream.CaptureModeDirect, result)
		if result < 0 || len(data) == 0 {
			continue
		}

		isKeyFrame := byte(0)
		if result == 3 {
			isKeyFrame = byte(1)
		}

		timestamp := time.Since(startTime).Microseconds()

		if err := s.send(clients, isKeyFrame, timestamp, data); err != nil {
			continue
		}

		if screen.FPS != fps && screen.FPS != 0 {
			fps = screen.FPS
			ticker.Reset(time.Second / time.Duration(fps))
		}

		stream.GetFrameRateCounter().Update()
	}
}

func (s *Streamer) send(clients []*websocket.Conn, isKeyFrame byte, timestamp int64, data []byte) error {
	buf := BufferPool.Get().(*bytes.Buffer)
	defer BufferPool.Put(buf)

	buf.Reset()
	buf.Grow(1 + 8 + len(data))

	if err := buf.WriteByte(isKeyFrame); err != nil {
		log.Errorf("failed to write keyframe flag: %s", err)
		return err
	}

	var tsBytes [8]byte
	binary.LittleEndian.PutUint64(tsBytes[:], uint64(timestamp))
	if _, err := buf.Write(tsBytes[:]); err != nil {
		log.Errorf("failed to write timestamp: %s", err)
		return err
	}

	if _, err := buf.Write(data); err != nil {
		log.Errorf("failed to write h264 data: %s", err)
		return err
	}

	for _, client := range clients {
		if err := client.WriteMessage(websocket.BinaryMessage, buf.Bytes()); err != nil {
			log.Errorf("failed to write message to client %s: %s.", client.RemoteAddr(), err)

			s.removeClient(client)
		}
	}

	return nil
}

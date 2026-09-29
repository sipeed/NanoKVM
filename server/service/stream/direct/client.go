package direct

import (
	"encoding/binary"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const (
	frameAckMessage     byte = 2
	streamResyncMessage byte = 3

	defaultQueueFrames = 8
	defaultQueueBytes  = 2 * 1024 * 1024
	maxFlowWindow      = 8
	writeWait          = 2 * time.Second
	pingPeriod         = 15 * time.Second
)

type outboundFrame struct {
	key       bool
	timestamp int64
	payload   []byte
}

type frameQueue struct {
	mutex sync.Mutex
	wake  chan struct{}

	frames      []*outboundFrame
	queuedBytes int
	inFlight    []int64

	maxFrames int
	maxBytes  int
	window    int

	flowControlled     bool
	waitingForKeyframe bool
	closed             bool
}

func newFrameQueue(maxFrames int, maxBytes int) *frameQueue {
	return &frameQueue{
		wake:               make(chan struct{}, 1),
		maxFrames:          maxFrames,
		maxBytes:           maxBytes,
		waitingForKeyframe: true,
	}
}

func (q *frameQueue) enableFlowControl(window int) {
	if window < 1 {
		window = 1
	}
	if window > maxFlowWindow {
		window = maxFlowWindow
	}

	q.mutex.Lock()
	q.clearFramesLocked()
	q.inFlight = q.inFlight[:0]
	q.window = window
	q.flowControlled = true
	q.waitingForKeyframe = true
	q.mutex.Unlock()
}

func (q *frameQueue) canAdvanceStream() bool {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if q.closed {
		return false
	}
	if !q.flowControlled {
		return true
	}

	if q.waitingForKeyframe {
		return len(q.inFlight) < q.window
	}

	return len(q.frames)+len(q.inFlight) < q.window
}

func (q *frameQueue) captureState() (active bool, flowControlled bool, canAdvance bool) {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if q.closed {
		return false, q.flowControlled, false
	}
	if !q.flowControlled {
		return true, false, true
	}
	if q.waitingForKeyframe {
		return true, true, len(q.inFlight) < q.window
	}

	return true, true, len(q.frames)+len(q.inFlight) < q.window
}

func (q *frameQueue) offer(frame *outboundFrame) bool {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if q.closed {
		return false
	}

	if frame.key {
		q.clearFramesLocked()
		if q.flowControlled && len(q.inFlight) >= q.window {
			q.waitingForKeyframe = true
			return false
		}
		q.waitingForKeyframe = false
		q.pushLocked(frame)
		q.signalLocked()
		return true
	}

	if q.waitingForKeyframe {
		return false
	}

	if q.flowControlled {
		if len(q.frames)+len(q.inFlight) >= q.window {
			q.clearFramesLocked()
			q.waitingForKeyframe = true
			return false
		}
	} else if len(q.frames) >= q.maxFrames || q.queuedBytes+len(frame.payload) > q.maxBytes {
		q.clearFramesLocked()
		q.waitingForKeyframe = true
		return false
	}

	q.pushLocked(frame)
	q.signalLocked()
	return true
}

func (q *frameQueue) popForWrite() *outboundFrame {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if q.closed || len(q.frames) == 0 {
		return nil
	}

	frame := q.frames[0]
	q.frames[0] = nil
	q.frames = q.frames[1:]
	q.queuedBytes -= len(frame.payload)
	if q.flowControlled {
		q.inFlight = append(q.inFlight, frame.timestamp)
	}

	return frame
}

func (q *frameQueue) acknowledge(timestamp int64) {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	acknowledged := 0
	for acknowledged < len(q.inFlight) && q.inFlight[acknowledged] <= timestamp {
		acknowledged++
	}
	if acknowledged == 0 {
		return
	}

	clear(q.inFlight[:acknowledged])
	q.inFlight = q.inFlight[acknowledged:]
}

func (q *frameQueue) requestResync() {
	q.mutex.Lock()
	q.clearFramesLocked()
	q.inFlight = q.inFlight[:0]
	q.waitingForKeyframe = true
	q.mutex.Unlock()
}

func (q *frameQueue) markDiscontinuity() {
	q.mutex.Lock()
	q.clearFramesLocked()
	q.waitingForKeyframe = true
	q.mutex.Unlock()
}

func (q *frameQueue) close() {
	q.mutex.Lock()
	q.closed = true
	q.clearFramesLocked()
	q.inFlight = q.inFlight[:0]
	q.mutex.Unlock()
}

func (q *frameQueue) pushLocked(frame *outboundFrame) {
	q.frames = append(q.frames, frame)
	q.queuedBytes += len(frame.payload)
}

func (q *frameQueue) clearFramesLocked() {
	clear(q.frames)
	q.frames = q.frames[:0]
	q.queuedBytes = 0
}

func (q *frameQueue) signalLocked() {
	select {
	case q.wake <- struct{}{}:
	default:
	}
}

type client struct {
	conn  *websocket.Conn
	queue *frameQueue

	done       chan struct{}
	writerDone chan struct{}
	closeOnce  sync.Once
}

func newClient(conn *websocket.Conn) *client {
	return &client{
		conn:       conn,
		queue:      newFrameQueue(defaultQueueFrames, defaultQueueBytes),
		done:       make(chan struct{}),
		writerDone: make(chan struct{}),
	}
}

func (c *client) start() {
	go c.writeLoop()
}

func (c *client) close() {
	c.closeOnce.Do(func() {
		close(c.done)
		c.queue.close()
		_ = c.conn.Close()
	})
}

func (c *client) wait() {
	<-c.writerDone
}

func (c *client) captureState() (active bool, flowControlled bool, canAdvance bool) {
	return c.queue.captureState()
}

func hasCaptureDemand(clients []*client) bool {
	for _, client := range clients {
		active, flowControlled, canAdvance := client.captureState()
		if !active {
			continue
		}
		if !flowControlled || canAdvance {
			return true
		}
	}

	return false
}

func (c *client) offer(frame *outboundFrame) {
	c.queue.offer(frame)
}

func (c *client) markDiscontinuity() {
	c.queue.markDiscontinuity()
}

func (c *client) handleControl(messageType int, data []byte) {
	if messageType != websocket.BinaryMessage || len(data) == 0 {
		return
	}

	switch data[0] {
	case frameAckMessage:
		if len(data) == 9 {
			timestamp := int64(binary.LittleEndian.Uint64(data[1:]))
			c.queue.acknowledge(timestamp)
		}
	case streamResyncMessage:
		if len(data) == 1 {
			c.queue.requestResync()
		}
	}
}

func newOutboundFrame(isKeyFrame bool, timestamp int64, storage []byte, data []byte) *outboundFrame {
	reuseStorage := len(storage) == 9+len(data)
	if reuseStorage && len(data) != 0 {
		reuseStorage = &storage[9] == &data[0]
	}

	payload := storage
	if !reuseStorage {
		payload = make([]byte, 9+len(data))
		copy(payload[9:], data)
	}
	if isKeyFrame {
		payload[0] = 1
	}
	binary.LittleEndian.PutUint64(payload[1:9], uint64(timestamp))

	return &outboundFrame{
		key:       isKeyFrame,
		timestamp: timestamp,
		payload:   payload,
	}
}

func (c *client) writeLoop() {
	defer close(c.writerDone)

	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()

	for {
		select {
		case <-pingTicker.C:
			deadline := time.Now().Add(writeWait)
			if err := c.conn.WriteControl(websocket.PingMessage, nil, deadline); err != nil {
				c.close()
				return
			}
		default:
		}

		if frame := c.queue.popForWrite(); frame != nil {
			if err := c.conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				c.close()
				return
			}
			if err := c.conn.WriteMessage(websocket.BinaryMessage, frame.payload); err != nil {
				log.Debugf("failed to write h264 frame to %s: %s", c.conn.RemoteAddr(), err)
				c.close()
				return
			}
			continue
		}

		select {
		case <-c.done:
			return
		case <-c.queue.wake:
		case <-pingTicker.C:
			deadline := time.Now().Add(writeWait)
			if err := c.conn.WriteControl(websocket.PingMessage, nil, deadline); err != nil {
				c.close()
				return
			}
		}
	}
}

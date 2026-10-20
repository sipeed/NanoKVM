package mjpeg

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

type controlledResponseWriter struct {
	header    http.Header
	deadline  time.Time
	flushErr  error
	writeSize int
}

func (w *controlledResponseWriter) Header() http.Header {
	return w.header
}

func (w *controlledResponseWriter) Write(data []byte) (int, error) {
	w.writeSize += len(data)
	return len(data), nil
}

func (w *controlledResponseWriter) WriteHeader(_ int) {}

func (w *controlledResponseWriter) SetWriteDeadline(deadline time.Time) error {
	w.deadline = deadline
	return nil
}

func (w *controlledResponseWriter) FlushError() error {
	return w.flushErr
}

func TestClientOfferKeepsNewestFrame(t *testing.T) {
	client := newMjpegClient(context.Background())
	client.offer([]byte("old"))
	client.offer([]byte("new"))

	frame, ok := client.next()
	if !ok {
		t.Fatal("client unexpectedly closed")
	}
	if got := string(frame); got != "new" {
		t.Fatalf("got frame %q, want newest frame", got)
	}
}

func TestClientNextStopsWhenContextIsCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	client := newMjpegClient(ctx)
	cancel()

	if _, ok := client.next(); ok {
		t.Fatal("next returned a frame after cancellation")
	}
}

func TestStopIfIdleKeepsStreamerRunningWhenClientArrives(t *testing.T) {
	streamer := NewStreamer()
	client := newMjpegClient(context.Background())

	streamer.mutex.Lock()
	streamer.running = true
	streamer.clients[client] = struct{}{}
	streamer.updateClientSnapshotLocked()
	streamer.mutex.Unlock()

	if streamer.stopIfIdle() {
		t.Fatal("streamer stopped with an active client")
	}
	if !streamer.running {
		t.Fatal("streamer running flag was cleared with an active client")
	}
}

func TestStopIfIdleClearsRunningFlag(t *testing.T) {
	streamer := NewStreamer()
	streamer.running = true

	if !streamer.stopIfIdle() {
		t.Fatal("idle streamer did not stop")
	}
	if streamer.running {
		t.Fatal("idle streamer running flag was not cleared")
	}
}

func TestWriteFrameUsesUnderlyingDeadlineAndFlushError(t *testing.T) {
	flushErr := errors.New("flush failed")
	underlying := &controlledResponseWriter{
		header:   make(http.Header),
		flushErr: flushErr,
	}
	context, _ := gin.CreateTestContext(underlying)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/stream/mjpeg", nil)

	err := writeFrame(context, newResponseController(context.Writer), []byte("frame"))
	if !errors.Is(err, flushErr) {
		t.Fatalf("writeFrame error = %v, want %v", err, flushErr)
	}
	if underlying.deadline.IsZero() {
		t.Fatal("write deadline was not set on the underlying response writer")
	}
	if underlying.writeSize == 0 {
		t.Fatal("frame was not written before flush")
	}
}

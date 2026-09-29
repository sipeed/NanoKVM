package direct

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func TestMarkDiscontinuityWaitsForNextKeyframe(t *testing.T) {
	queue := newFrameQueue(defaultQueueFrames, defaultQueueBytes)
	queue.enableFlowControl(1)

	firstKey := newOutboundFrame(true, 10, nil, []byte("key"))
	if !queue.offer(firstKey) {
		t.Fatal("initial keyframe was rejected")
	}
	if got := queue.popForWrite(); got != firstKey {
		t.Fatalf("popped frame = %p, want %p", got, firstKey)
	}
	if queue.canAdvanceStream() {
		t.Fatal("full flow-control window unexpectedly accepted another frame")
	}

	queue.markDiscontinuity()
	queue.acknowledge(firstKey.timestamp)
	if !queue.canAdvanceStream() {
		t.Fatal("acknowledged discontinuity did not let the stream seek a keyframe")
	}
	if queue.offer(newOutboundFrame(false, 20, nil, []byte("delta"))) {
		t.Fatal("delta frame after a discontinuity was accepted")
	}

	nextKey := newOutboundFrame(true, 30, nil, []byte("key"))
	if !queue.offer(nextKey) {
		t.Fatal("recovery keyframe was rejected")
	}
	if got := queue.popForWrite(); got != nextKey {
		t.Fatalf("popped recovery frame = %p, want %p", got, nextKey)
	}
}

func TestNewOutboundFrameReusesHeadroom(t *testing.T) {
	storage := make([]byte, 13)
	data := storage[9:]
	copy(data, []byte{1, 2, 3, 4})

	frame := newOutboundFrame(true, 42, storage, data)

	if &frame.payload[0] != &storage[0] {
		t.Fatal("payload did not reuse capture storage")
	}
	if frame.payload[0] != 1 {
		t.Fatalf("keyframe marker = %d, want 1", frame.payload[0])
	}
	if timestamp := binary.LittleEndian.Uint64(frame.payload[1:9]); timestamp != 42 {
		t.Fatalf("timestamp = %d, want 42", timestamp)
	}
	if !bytes.Equal(frame.payload[9:], []byte{1, 2, 3, 4}) {
		t.Fatalf("frame data = %v", frame.payload[9:])
	}
}

func TestNewOutboundFrameFallsBackWithoutHeadroom(t *testing.T) {
	data := []byte{5, 6, 7}
	frame := newOutboundFrame(false, 7, nil, data)

	if frame.payload[0] != 0 {
		t.Fatalf("keyframe marker = %d, want 0", frame.payload[0])
	}
	if timestamp := binary.LittleEndian.Uint64(frame.payload[1:9]); timestamp != 7 {
		t.Fatalf("timestamp = %d, want 7", timestamp)
	}
	if !bytes.Equal(frame.payload[9:], data) {
		t.Fatalf("frame data = %v, want %v", frame.payload[9:], data)
	}
}

func TestNewOutboundFrameFallsBackForUnrelatedStorage(t *testing.T) {
	storage := make([]byte, 12)
	data := []byte{8, 9, 10}
	frame := newOutboundFrame(false, 11, storage, data)

	if &frame.payload[0] == &storage[0] {
		t.Fatal("payload reused storage that does not contain frame data")
	}
	if !bytes.Equal(frame.payload[9:], data) {
		t.Fatalf("frame data = %v, want %v", frame.payload[9:], data)
	}
}

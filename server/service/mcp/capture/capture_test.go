package mcpcapture

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	"sync"
	"testing"
	"time"

	mcpservice "NanoKVM-Server/service/mcp"
)

func testJPEG(t *testing.T, width int, height int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	img.Set(0, 0, color.White)
	var output bytes.Buffer
	if err := jpeg.Encode(&output, img, nil); err != nil {
		t.Fatal(err)
	}
	return output.Bytes()
}

type visionResponse struct {
	data   []byte
	result int
}

type fakeVision struct {
	mu        sync.Mutex
	responses []visionResponse
	calls     int
	quality   uint16
	active    int
	maxActive int
	delay     time.Duration
}

func (v *fakeVision) ReadMjpeg(_ uint16, _ uint16, quality uint16) ([]byte, int) {
	v.mu.Lock()
	v.calls++
	v.quality = quality
	v.active++
	if v.active > v.maxActive {
		v.maxActive = v.active
	}
	index := v.calls - 1
	response := visionResponse{result: -1}
	if index < len(v.responses) {
		response = v.responses[index]
	} else if len(v.responses) > 0 {
		response = v.responses[len(v.responses)-1]
	}
	v.mu.Unlock()

	time.Sleep(v.delay)

	v.mu.Lock()
	v.active--
	v.mu.Unlock()
	return response.data, response.result
}

func TestCaptureSuccessAndQualityBounds(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{data: testJPEG(t, 1920, 1080), result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 1920, 1080 })

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil {
		t.Fatal(err)
	}
	if !snapshot.OK || snapshot.Width != 1920 || snapshot.Height != 1080 || vision.quality != defaultQuality {
		t.Fatalf("snapshot=%+v quality=%d", snapshot, vision.quality)
	}

	_, err = snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{Quality: 200})
	if err != nil || vision.quality != 100 {
		t.Fatalf("quality clamp=%d err=%v", vision.quality, err)
	}
}

func TestCaptureRetriesNoSignal(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{result: 5}, {result: -5}, {data: testJPEG(t, 1280, 720), result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 1280, 720 })
	snapshotter.retryDelay = 0

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || !snapshot.OK || vision.calls != 3 {
		t.Fatalf("snapshot=%+v calls=%d err=%v", snapshot, vision.calls, err)
	}

	timeout := 0
	vision = &fakeVision{responses: []visionResponse{{result: 5}}}
	snapshotter = New(vision, func() (uint16, uint16) { return 1280, 720 })
	snapshot, err = snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{TimeoutMS: &timeout})
	if err != nil || snapshot.RetCode != 5 || vision.calls != 1 {
		t.Fatalf("timeout snapshot=%+v calls=%d err=%v", snapshot, vision.calls, err)
	}
}

func TestCaptureRejectsCropAndEmptyData(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 800, 600 })
	if _, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{W: 10}); err == nil {
		t.Fatal("expected crop error")
	}
	if vision.calls != 0 {
		t.Fatalf("vision called for rejected crop: %d", vision.calls)
	}

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || snapshot.OK || snapshot.Message == "" {
		t.Fatalf("snapshot=%+v err=%v", snapshot, err)
	}
}

func TestCaptureSerializesConcurrentCalls(t *testing.T) {
	vision := &fakeVision{
		responses: []visionResponse{{data: testJPEG(t, 800, 600), result: 0}},
		delay:     10 * time.Millisecond,
	}
	snapshotter := New(vision, func() (uint16, uint16) { return 800, 600 })

	var wg sync.WaitGroup
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, _ = snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
		}()
	}
	wg.Wait()
	if vision.maxActive != 1 {
		t.Fatalf("max concurrent captures = %d", vision.maxActive)
	}
}

func TestCaptureUsesJPEGDimensionsForAutomaticResolution(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{data: testJPEG(t, 640, 480), result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 0, 0 })

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil {
		t.Fatal(err)
	}
	if !snapshot.OK || snapshot.Width != 640 || snapshot.Height != 480 {
		t.Fatalf("snapshot=%+v", snapshot)
	}
}

func TestCaptureCancellationWhileWaitingForSlot(t *testing.T) {
	snapshotter := New(&fakeVision{}, func() (uint16, uint16) { return 0, 0 })
	snapshotter.captureSlot <- struct{}{}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := snapshotter.Capture(ctx, mcpservice.SnapshotRequest{})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error=%v, want canceled", err)
	}
	<-snapshotter.captureSlot
}

func TestCaptureTimeoutStartsAfterSlotIsAcquired(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{data: testJPEG(t, 320, 240), result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 320, 240 })
	snapshotter.captureSlot <- struct{}{}

	timeout := 1
	done := make(chan struct {
		snapshot mcpservice.Snapshot
		err      error
	}, 1)
	go func() {
		snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{TimeoutMS: &timeout})
		done <- struct {
			snapshot mcpservice.Snapshot
			err      error
		}{snapshot: snapshot, err: err}
	}()

	time.Sleep(5 * time.Millisecond)
	<-snapshotter.captureSlot
	select {
	case result := <-done:
		if result.err != nil || !result.snapshot.OK {
			t.Fatalf("snapshot=%+v err=%v, want success after queue wait", result.snapshot, result.err)
		}
	case <-time.After(time.Second):
		t.Fatal("capture did not complete after slot release")
	}
}

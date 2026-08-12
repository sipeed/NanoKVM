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
	width     uint16
	height    uint16
	active    int
	maxActive int
	delay     time.Duration
}

func (v *fakeVision) ReadMjpeg(width uint16, height uint16, quality uint16) ([]byte, int) {
	v.mu.Lock()
	v.calls++
	v.quality = quality
	v.width = width
	v.height = height
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
	if !snapshot.OK || snapshot.Width != 1920 || snapshot.Height != 1080 || vision.quality != defaultQuality || vision.width != 1920 || vision.height != 1080 {
		t.Fatalf("snapshot=%+v capture=%dx%d quality=%d", snapshot, vision.width, vision.height, vision.quality)
	}

	_, err = snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{Quality: 200})
	if err != nil || vision.quality != maximumQuality {
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

func TestCaptureRetriesInitialReadFailure(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{
		{result: -1},
		{data: testJPEG(t, 1280, 720), result: 0},
	}}
	snapshotter := New(vision, func() (uint16, uint16) { return 1280, 720 })
	snapshotter.retryDelay = 0

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || !snapshot.OK || vision.calls != 2 {
		t.Fatalf("snapshot=%+v calls=%d err=%v", snapshot, vision.calls, err)
	}
}

func TestCaptureRetriesInvalidJPEG(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{
		{data: []byte("partial jpeg"), result: 0},
		{data: testJPEG(t, 1280, 720), result: 0},
	}}
	snapshotter := New(vision, func() (uint16, uint16) { return 1280, 720 })
	snapshotter.retryDelay = 0

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || !snapshot.OK || vision.calls != 2 {
		t.Fatalf("snapshot=%+v calls=%d err=%v", snapshot, vision.calls, err)
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

func TestCapturePassesThroughAutomaticResolution(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{data: testJPEG(t, 640, 480), result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 0, 0 })

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil {
		t.Fatal(err)
	}
	if !snapshot.OK || snapshot.Width != 640 || snapshot.Height != 480 || vision.width != 0 || vision.height != 0 {
		t.Fatalf("snapshot=%+v capture=%dx%d", snapshot, vision.width, vision.height)
	}
}

func TestCaptureDropsClaimedFirstFreshFrame(t *testing.T) {
	first := testJPEG(t, 320, 240)
	second := testJPEG(t, 640, 480)
	vision := &fakeVision{responses: []visionResponse{
		{data: first, result: 0},
		{data: second, result: 0},
	}}
	claimed := 0
	snapshotter := NewWithCaptureLease(vision, func() (uint16, uint16) { return 640, 480 }, func(context.Context) (func(), func() bool, error) {
		return nil, func() bool {
			claimed++
			return claimed == 1
		}, nil
	})

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || !snapshot.OK || !bytes.Equal(snapshot.JPEG, second) || vision.calls != 2 || claimed != 1 {
		t.Fatalf("snapshot=%+v calls=%d claimed=%d err=%v", snapshot, vision.calls, claimed, err)
	}
}

func TestCaptureRejectsOversizedJPEG(t *testing.T) {
	data := make([]byte, maximumJPEGBytes+1)
	vision := &fakeVision{responses: []visionResponse{{data: data, result: 0}}}
	snapshotter := New(vision, func() (uint16, uint16) { return 960, 540 })

	snapshot, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{})
	if err != nil || snapshot.OK || len(snapshot.JPEG) != 0 || snapshot.Message == "" {
		t.Fatalf("snapshot=%+v err=%v", snapshot, err)
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

func TestCaptureReleasesLeaseOnSuccessAndCancellation(t *testing.T) {
	vision := &fakeVision{responses: []visionResponse{{data: testJPEG(t, 320, 240), result: 0}}}
	acquired := 0
	released := 0
	snapshotter := NewWithCaptureLease(vision, func() (uint16, uint16) { return 320, 240 }, func(context.Context) (func(), func() bool, error) {
		acquired++
		return func() { released++ }, nil, nil
	})

	if _, err := snapshotter.Capture(context.Background(), mcpservice.SnapshotRequest{}); err != nil {
		t.Fatal(err)
	}
	if acquired != 1 || released != 1 {
		t.Fatalf("lease acquired=%d released=%d, want 1/1", acquired, released)
	}

	canceled, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := snapshotter.Capture(canceled, mcpservice.SnapshotRequest{}); !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want canceled", err)
	}
	if acquired != 1 || released != 1 {
		t.Fatalf("lease acquired=%d released=%d after cancellation before acquisition, want 1/1", acquired, released)
	}
}

type blockingVision struct {
	started chan struct{}
	finish  chan struct{}
}

func (v *blockingVision) ReadMjpeg(_ uint16, _ uint16, _ uint16) ([]byte, int) {
	v.started <- struct{}{}
	<-v.finish
	return nil, 5
}

func TestCaptureReleasesLeaseAfterAcquisitionCancellation(t *testing.T) {
	vision := &blockingVision{started: make(chan struct{}, 1), finish: make(chan struct{})}
	acquired := 0
	released := 0
	snapshotter := NewWithCaptureLease(vision, func() (uint16, uint16) { return 320, 240 }, func(context.Context) (func(), func() bool, error) {
		acquired++
		return func() { released++ }, nil, nil
	})

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() {
		_, err := snapshotter.Capture(ctx, mcpservice.SnapshotRequest{})
		done <- err
	}()
	<-vision.started
	cancel()
	close(vision.finish)
	if err := <-done; !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want canceled", err)
	}
	if acquired != 1 || released != 1 {
		t.Fatalf("lease acquired=%d released=%d after cancellation during capture, want 1/1", acquired, released)
	}
}

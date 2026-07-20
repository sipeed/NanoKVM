package mcpcapture

import (
	"bytes"
	"context"
	"fmt"
	"image/jpeg"
	"time"

	mcpservice "NanoKVM-Server/service/mcp"
)

const (
	defaultQuality       = 85
	screenshotRetryDelay = 100 * time.Millisecond
	maxTimeoutMS         = 30_000
)

type VisionReader interface {
	ReadMjpeg(width uint16, height uint16, quality uint16) ([]byte, int)
}

type ScreenReader func() (width uint16, height uint16)

type Snapshotter struct {
	vision      VisionReader
	readScreen  ScreenReader
	captureSlot chan struct{}
	retryDelay  time.Duration
}

func New(vision VisionReader, readScreen ScreenReader) *Snapshotter {
	return &Snapshotter{
		vision:      vision,
		readScreen:  readScreen,
		captureSlot: make(chan struct{}, 1),
		retryDelay:  screenshotRetryDelay,
	}
}

func (s *Snapshotter) Capture(ctx context.Context, req mcpservice.SnapshotRequest) (mcpservice.Snapshot, error) {
	if req.X != 0 || req.Y != 0 || req.W != 0 || req.H != 0 {
		return mcpservice.Snapshot{}, fmt.Errorf("screenshot cropping is not supported")
	}
	if s.vision == nil || s.readScreen == nil {
		return mcpservice.Snapshot{}, fmt.Errorf("screenshot capture is unavailable")
	}

	quality := req.Quality
	if quality == 0 {
		quality = defaultQuality
	}
	quality = clamp(quality, 1, 100)

	timeoutMS := 1000
	if req.TimeoutMS != nil {
		timeoutMS = clamp(*req.TimeoutMS, 0, maxTimeoutMS)
	}

	select {
	case s.captureSlot <- struct{}{}:
		defer func() { <-s.captureSlot }()
	case <-ctx.Done():
		return mcpservice.Snapshot{}, ctx.Err()
	}

	deadline := time.Now().Add(time.Duration(timeoutMS) * time.Millisecond)
	width, height := s.readScreen()
	for {
		if err := ctx.Err(); err != nil {
			return mcpservice.Snapshot{}, err
		}
		if timeoutMS > 0 && !time.Now().Before(deadline) {
			return mcpservice.Snapshot{Message: "screenshot capture timed out"}, nil
		}

		data, result := s.vision.ReadMjpeg(width, height, uint16(quality))
		snapshot := mcpservice.Snapshot{
			RetCode: result,
			Width:   int(width),
			Height:  int(height),
			JPEG:    data,
		}
		switch {
		case result >= 0 && result != 5 && len(data) > 0:
			config, err := jpeg.DecodeConfig(bytes.NewReader(data))
			if err != nil {
				snapshot.Message = "captured data is not a valid JPEG"
				return snapshot, nil
			}
			snapshot.OK = true
			snapshot.Width = config.Width
			snapshot.Height = config.Height
			return snapshot, nil
		case result == 5:
			snapshot.Message = "no HDMI signal or frame unavailable"
		case result == -3 || result == -4 || result == -5:
			snapshot.Message = "screenshot capture is temporarily unavailable"
		case result < 0 || len(data) == 0:
			snapshot.Message = "failed to capture screenshot"
			return snapshot, nil
		}

		if timeoutMS == 0 || time.Now().Add(s.retryDelay).After(deadline) {
			return snapshot, nil
		}
		timer := time.NewTimer(s.retryDelay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return mcpservice.Snapshot{}, ctx.Err()
		case <-timer.C:
		}
	}
}

func clamp(value int, minValue int, maxValue int) int {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

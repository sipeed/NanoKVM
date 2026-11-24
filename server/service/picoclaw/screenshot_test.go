package picoclaw

import (
	"context"
	"testing"

	hdmistate "NanoKVM-Server/service/vm/hdmi_state"
)

type screenshotVision struct {
	width, height uint16
}

func (v *screenshotVision) ReadMjpeg(width, height, _ uint16) ([]byte, int) {
	v.width, v.height = width, height
	return []byte("frame"), 0
}

func TestScreenshotUsesLeaseSizeForScalingAndMetadata(t *testing.T) {
	vision := &screenshotVision{}
	s := Service{
		vision: vision,
		acquireHDMIForRead: func(context.Context) (hdmistate.ReadLease, error) {
			return hdmistate.ReadLease{Width: 1920, Height: 1080, Release: func() {}}, nil
		},
	}
	_, meta, err := s.captureScreenshot(t.Context(), ScreenshotQuery{Width: 640})
	if err != nil {
		t.Fatal(err)
	}
	if meta.SourceWidth != 1920 || meta.SourceHeight != 1080 || meta.CaptureWidth != 640 || meta.CaptureHeight != 360 {
		t.Fatalf("unexpected screenshot metadata: %+v", meta)
	}
	if vision.width != 640 || vision.height != 360 {
		t.Fatalf("capture=%dx%d, want 640x360", vision.width, vision.height)
	}
}

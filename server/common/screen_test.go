package common

import (
	"errors"
	"testing"
)

func TestCheckScreenAcceptsKnownVideoBitRates(t *testing.T) {
	previous := screen
	defer func() { screen = previous }()

	for _, bitRate := range []uint16{1000, 2000, 3000, 5000, 10000} {
		screen = &Screen{Height: 1080, Quality: 80, BitRate: bitRate}
		checkScreen(screen)
		if screen.BitRate != bitRate {
			t.Fatalf("bit rate = %d; want %d", screen.BitRate, bitRate)
		}
	}
}

func TestCheckScreenRejectsUnknownVideoBitRate(t *testing.T) {
	previous := screen
	defer func() { screen = previous }()

	for _, bitRate := range []uint16{0, 500, 7500, 10001} {
		screen = &Screen{Height: 1080, Quality: 80, BitRate: bitRate}
		checkScreen(screen)
		if screen.BitRate != 3000 {
			t.Fatalf("bit rate = %d; want 3000 for unknown input %d", screen.BitRate, bitRate)
		}
	}
}

func TestLoadScreenReadsPersistedSettings(t *testing.T) {
	files := map[string][]byte{
		"/kvmapp/kvm/fps":  []byte("60\n"),
		"/kvmapp/kvm/qlty": []byte("5000"),
		"/kvmapp/kvm/res":  []byte("720"),
	}

	got := loadScreen(func(path string) ([]byte, error) {
		data, ok := files[path]
		if !ok {
			return nil, errors.New("not found")
		}
		return data, nil
	})

	if got.FPS != 60 {
		t.Fatalf("FPS = %d, want 60", got.FPS)
	}
	if got.BitRate != 5000 {
		t.Fatalf("BitRate = %d, want 5000", got.BitRate)
	}
	if got.Width != 1280 || got.Height != 720 {
		t.Fatalf("resolution = %dx%d, want 1280x720", got.Width, got.Height)
	}
}

func TestLoadScreenKeepsDefaultsForMissingOrInvalidSettings(t *testing.T) {
	files := map[string][]byte{
		"/kvmapp/kvm/qlty": []byte("9999"),
		"/kvmapp/kvm/res":  []byte("invalid"),
	}

	got := loadScreen(func(path string) ([]byte, error) {
		data, ok := files[path]
		if !ok {
			return nil, errors.New("not found")
		}
		return data, nil
	})

	if got.FPS != 30 {
		t.Fatalf("FPS = %d, want default 30", got.FPS)
	}
	if got.Quality != 80 || got.BitRate != 3000 {
		t.Fatalf("quality = %d, bitrate = %d; want 80 and 3000", got.Quality, got.BitRate)
	}
	if got.Width != 0 || got.Height != 0 {
		t.Fatalf("resolution = %dx%d, want default 0x0", got.Width, got.Height)
	}
}

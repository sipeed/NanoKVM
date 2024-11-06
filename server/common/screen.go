package common

import "sync"

type Screen struct {
	Width   uint16
	Height  uint16
	FPS     int
	Quality uint16
	BitRate uint16
}

var (
	screen     *Screen
	screenOnce sync.Once
)

// ResolutionMap height to width
var ResolutionMap = map[uint16]uint16{
	1080: 1920,
	720:  1280,
	600:  800,
	480:  640,
	0:    0,
}

var QualityMap = map[uint16]bool{
	100: true,
	80:  true,
	60:  true,
	50:  true,
}

var BitRateMap = map[uint16]bool{
	5000: true,
	3000: true,
	2000: true,
	1000: true,
}

func GetScreen() *Screen {
	screenOnce.Do(func() {
		screen = &Screen{
			Width:   0,
			Height:  0,
			Quality: 80,
			FPS:     30,
			BitRate: 3000,
		}
	})

	return screen
}

func SetScreen(key string, value int) {
	switch key {
	case "resolution":
		height := uint16(value)
		if width, ok := ResolutionMap[height]; ok {
			screen.Width = width
			screen.Height = height
		}

	case "quality":
		if value > 100 {
			screen.BitRate = uint16(value)
		} else {
			screen.Quality = uint16(value)
		}

	case "fps":
		screen.FPS = validateFPS(value)
	}
}

func validateFPS(fps int) int {
	if fps > 60 {
		return 60
	}
	if fps < 10 {
		return 10
	}

	return fps
}

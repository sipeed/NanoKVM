package common

import (
	"os"
	"strconv"
	"strings"
	"sync"
)

type Screen struct {
	FPS     int
	Quality uint16
	BitRate uint16
	GOP     uint8
}

var (
	screen     *Screen
	screenOnce sync.Once
)

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
			Quality: 80,
			FPS:     30,
			BitRate: 3000,
			GOP:     30,
		}
	})

	return screen
}

func SetScreen(key string, value int) {
	switch key {
	case "quality":
		if value > 100 {
			screen.BitRate = uint16(value)
		} else {
			screen.Quality = uint16(value)
		}

	case "fps":
		screen.FPS = validateFPS(value)

	case "gop":
		screen.GOP = uint8(value)
	}
}

func CheckScreen() {
	if _, ok := QualityMap[screen.Quality]; !ok {
		screen.Quality = 80
	}

	if _, ok := BitRateMap[screen.BitRate]; !ok {
		screen.BitRate = 3000
	}
}

func InputSize() (uint16, uint16) {
	read := func(path string) uint16 {
		data, err := os.ReadFile(path)
		if err != nil {
			return 0
		}
		value, err := strconv.ParseUint(strings.TrimSpace(string(data)), 10, 16)
		if err != nil {
			return 0
		}
		return uint16(value)
	}
	return read("/kvmapp/kvm/width"), read("/kvmapp/kvm/height")
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

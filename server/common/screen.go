package common

import (
	"os"
	"strconv"
	"strings"
	"sync"
)

type Screen struct {
	Width   uint16
	Height  uint16
	FPS     int
	Quality uint16
	BitRate uint16
	GOP     uint8
}

var (
	screen     *Screen
	screenOnce sync.Once
)

var screenFileMap = map[string]string{
	"fps":        "/kvmapp/kvm/fps",
	"quality":    "/kvmapp/kvm/qlty",
	"resolution": "/kvmapp/kvm/res",
}

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
	10000: true,
	5000:  true,
	3000:  true,
	2000:  true,
	1000:  true,
}

func GetScreen() *Screen {
	screenOnce.Do(func() {
		screen = loadScreen(os.ReadFile)
	})

	return screen
}

func SetScreen(key string, value int) {
	setScreenValue(GetScreen(), key, value)
}

func setScreenValue(target *Screen, key string, value int) {
	switch key {
	case "resolution":
		height := uint16(value)
		if width, ok := ResolutionMap[height]; ok {
			target.Width = width
			target.Height = height
		}

	case "quality":
		if value > 100 {
			target.BitRate = uint16(value)
		} else {
			target.Quality = uint16(value)
		}

	case "fps":
		target.FPS = validateFPS(value)

	case "gop":
		target.GOP = uint8(value)
	}
}

func CheckScreen() {
	checkScreen(GetScreen())
}

func checkScreen(target *Screen) {
	if _, ok := ResolutionMap[target.Height]; !ok {
		target.Width = 1920
		target.Height = 1080
	}

	if _, ok := QualityMap[target.Quality]; !ok {
		target.Quality = 80
	}

	if _, ok := BitRateMap[target.BitRate]; !ok {
		target.BitRate = 3000
	}
}

func loadScreen(readFile func(string) ([]byte, error)) *Screen {
	target := &Screen{
		Width:   0,
		Height:  0,
		Quality: 80,
		FPS:     30,
		BitRate: 3000,
		GOP:     30,
	}

	for key, path := range screenFileMap {
		data, err := readFile(path)
		if err != nil {
			continue
		}

		value, err := strconv.Atoi(strings.TrimSpace(string(data)))
		if err != nil {
			continue
		}

		setScreenValue(target, key, value)
	}

	checkScreen(target)
	return target
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

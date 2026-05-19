package stream

import (
	"fmt"
	"os"
	"sync"
	"sync/atomic"
	"time"

	log "github.com/sirupsen/logrus"
)

var (
	counter     *FrameRateCounter
	counterOnce sync.Once
)

type FrameRateCounter struct {
	frameCount atomic.Int32
	fps        atomic.Int32
}

func GetFrameRateCounter() *FrameRateCounter {
	counterOnce.Do(func() {
		counter = &FrameRateCounter{}

		go func() {
			ticker := time.NewTicker(3 * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				currentCount := counter.frameCount.Swap(0)
				counter.fps.Store(currentCount / 3)

				data := fmt.Sprintf("%d", counter.fps.Load())
				err := os.WriteFile("/kvmapp/kvm/now_fps", []byte(data), 0o666)
				if err != nil {
					log.Errorf("failed to write fps: %s", err)
				}
			}
		}()
	})

	return counter
}

func (f *FrameRateCounter) Update() {
	f.frameCount.Add(1)
}

func (f *FrameRateCounter) GetFPS() int32 {
	return f.fps.Load()
}

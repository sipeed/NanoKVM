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
	frameCount int32
	fps        int32
	mutex      sync.Mutex
}

func GetFrameRateCounter() *FrameRateCounter {
	counterOnce.Do(func() {
		counter = &FrameRateCounter{}

		go func() {
			ticker := time.NewTicker(3 * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				counter.mutex.Lock()

				currentCount := atomic.LoadInt32(&counter.frameCount)

				counter.fps = currentCount / 3
				atomic.StoreInt32(&counter.frameCount, 0)

				counter.mutex.Unlock()

				data := fmt.Sprintf("%d", counter.fps)
				err := os.WriteFile("/kvmapp/kvm/now_fps", []byte(data), 0o666)
				if err != nil {
					log.Errorf("failed to wirte fps: %s", err)
				}
			}
		}()
	})

	return counter
}

func (f *FrameRateCounter) Update() {
	atomic.AddInt32(&f.frameCount, 1)
}

func (f *FrameRateCounter) GetFPS() int32 {
	f.mutex.Lock()
	defer f.mutex.Unlock()

	return f.fps
}

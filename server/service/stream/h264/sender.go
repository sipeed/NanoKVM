package h264

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"time"

	"github.com/pion/webrtc/v4/pkg/media"
	log "github.com/sirupsen/logrus"
)

func send() {
	screen := common.GetScreen()
	fps := screen.FPS
	duration := time.Second / time.Duration(fps)

	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	vision := common.GetKvmVision()
	for {
		select {
		case <-ticker.C:
			height := screen.Height
			width, ok := common.ResolutionMap[height]
			if !ok {
				width = 0
				height = 0
			}

			bitRate := screen.BitRate
			if _, ok := common.BitRateMap[bitRate]; !ok {
				bitRate = 3000
			}

			data, sps, pps, result := vision.ReadH264(width, height, bitRate)
			if result < 0 {
				continue
			}

			if result == 3 {
				writeSample(sps, duration)
				writeSample(pps, duration)
			}
			writeSample(data, duration)

			stream.GetFrameRateCounter().Update()

			if screen.FPS != fps {
				fps = screen.FPS
				duration = time.Second / time.Duration(fps)
				ticker.Reset(duration)
			}

		case <-exitSig:
			mutex.Lock()
			isSending = false
			mutex.Unlock()
			return
		}
	}
}

func writeSample(data []byte, duration time.Duration) {
	sample := media.Sample{
		Data:     data,
		Duration: duration,
	}

	mutex.RLock()
	defer mutex.RUnlock()

	for _, track := range trackMap {
		if err := track.WriteSample(sample); err != nil {
			log.Errorf("failed to send h264 data: %s", err)
		}
	}

	log.Debugf("send h264 data: %d", len(data))
}

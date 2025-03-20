package h264

import (
	"NanoKVM-Server/common"
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
	for range ticker.C {
		if !isSending && len(trackMap) == 0 {
			return
		}

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

		data, result := vision.ReadH264(width, height, bitRate)
		if result < 0 {
			continue
		}

		sample := media.Sample{
			Data:     data,
			Duration: duration,
		}

		for _, track := range trackMap {
			if err := track.WriteSample(sample); err != nil {
				log.Errorf("failed to send h264 data: %s", err)
			}
		}

		log.Debugf("send h264 data: %d", len(data))

		if screen.FPS != fps {
			fps = screen.FPS
			duration = time.Second / time.Duration(fps)
			ticker.Reset(duration)
		}
	}
}

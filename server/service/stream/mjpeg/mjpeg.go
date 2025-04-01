package mjpeg

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var (
	chanMap = make(map[*gin.Context]bool)
	mutex   = sync.Mutex{}
	exitSig = make(chan bool, 1)
)

func Connect(c *gin.Context) {
	c.Header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Pragma", "no-cache")

	mutex.Lock()
	chanMap[c] = true
	if len(chanMap) == 1 {
		go send()
	}
	mutex.Unlock()

	<-c.Request.Context().Done()

	mutex.Lock()
	delete(chanMap, c)
	if len(chanMap) == 0 {
		exitSig <- true
	}
	mutex.Unlock()
}

func send() {
	screen := common.GetScreen()
	common.CheckScreen()

	fps := screen.FPS

	ticker := time.NewTicker(time.Second / time.Duration(fps))
	defer ticker.Stop()

	vision := common.GetKvmVision()
	for {
		select {
		case <-ticker.C:
			data, result := vision.ReadMjpeg(screen.Width, screen.Height, screen.Quality)
			if result < 0 || result == 5 {
				continue
			}

			for c := range chanMap {
				if err := write(c, data); err != nil {
					log.Debugf("failed to write mjpeg data: %s", err)
				}
			}
			log.Debugf("send mjpeg data: %d", len(data))

			stream.GetFrameRateCounter().Update()

			if screen.FPS != fps {
				fps = screen.FPS
				ticker.Reset(time.Second / time.Duration(fps))
			}

		case <-exitSig:
			return
		}
	}
}

func write(c *gin.Context, data []byte) (err error) {
	if _, err = c.Writer.Write([]byte("--frame\r\n")); err != nil {
		return
	}

	if _, err = c.Writer.Write([]byte("Content-Type: image/jpeg\r\n\r\n")); err != nil {
		return
	}

	if _, err = c.Writer.Write(data); err != nil {
		return
	}

	if _, err = c.Writer.Write([]byte("\r\n")); err != nil {
		return
	}

	c.Writer.Flush()
	return
}

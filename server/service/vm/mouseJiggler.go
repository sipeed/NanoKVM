package vm

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
	"os"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	mouseJiggleInterval   = 15
	MouseJigglerStartFlag = "/etc/kvm/mouse-jiggler_start"
)

var (
	jigglerEnabled  int32
	jigglerStopChan chan struct{}
)

type mouseReport struct {
	buttons byte
	xMove   int8
	yMove   int8
	wheel   int8
}

func init() {
	enabled := isMouseJigglerEnabled()
	if enabled {
		hid.UpdateLastHIDTime()
		go mouseJigglerRoutine()
	}
}

func (s *Service) GetMouseJigglerState(c *gin.Context) {
	var rsp proto.Response
	enabled := isMouseJigglerEnabled()
	rsp.OkRspWithData(c, &proto.GetMouseJigglerStateRsp{
		Enabled: enabled,
	})
}

func (s *Service) EnableMouseJiggler(c *gin.Context) {
	var rsp proto.Response

	enabled := isMouseJigglerEnabled()
	if enabled {
		rsp.OkRsp(c)
		return
	}

	atomic.StoreInt32(&jigglerEnabled, 1)
	jigglerStopChan = make(chan struct{})
	go mouseJigglerRoutine()

	fp, err := os.Create(MouseJigglerStartFlag)
	if err != nil {
		log.Errorf("MouseJiggler enable failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	defer fp.Close()

	rsp.OkRsp(c)
	log.Debugf("MouseJiggler enabled")
}

func (s *Service) DisableMouseJiggler(c *gin.Context) {
	var rsp proto.Response

	enabled := isMouseJigglerEnabled()
	if !enabled {
		rsp.OkRsp(c)
		return
	}

	atomic.StoreInt32(&jigglerEnabled, 0)
	close(jigglerStopChan)
	_ = os.Remove(MouseJigglerStartFlag)

	rsp.OkRsp(c)
	log.Debugf("MouseJiggler disabled")
}

func isMouseJigglerEnabled() bool {
	if atomic.LoadInt32(&jigglerEnabled) == 1 {
		return true
	}

	return false

}

func mouseJigglerRoutine() {
	ticker := time.NewTicker(mouseJiggleInterval * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if shouldJiggleMouse() {
				hid.UpdateLastHIDTime()
				jiggleMouse()
			}
		case <-jigglerStopChan:
			return
		}
	}
}

func shouldJiggleMouse() bool {
	enabled := isMouseJigglerEnabled()
	if !enabled {
		return false
	}
	hid.HidMutex.Lock()
	defer hid.HidMutex.Unlock()

	if time.Since(hid.LastHIDTime) < mouseJiggleInterval*time.Second {
		return false
	}

	return true
}

func jiggleMouse() {
	moveRight := []byte{0x00, 0x0a, 0x00, 0x00}
	moveLeft := []byte{0x00, 0xf6, 0x00, 0x00}

	err := os.WriteFile("/dev/hidg1", moveRight, 0644)
	if err != nil {
		log.Debugf("MouseJiggler write error:", err)
		return
	}

	err = os.WriteFile("/dev/hidg1", moveLeft, 0644)
	if err != nil {
		log.Debugf("MouseJiggler write error:", err)
		return
	}
}

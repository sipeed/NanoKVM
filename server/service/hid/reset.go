package hid

import (
	"NanoKVM-Server/proto"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) resetHID() error {
	// reset USB
	f, err := os.OpenFile("/sys/kernel/config/usb_gadget/g0/UDC", os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	defer f.Close()

	err = f.Truncate(0)
	if err != nil {
		log.Errorf("truncate /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	_, err = f.Seek(0, 0)
	if err != nil {
		log.Errorf("seek to 0 failed: %s", err)
		return err
	}
	_, err = f.WriteString("\n")
	if err != nil {
		log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}

	time.Sleep(1 * time.Second)

	devices, err := os.ReadDir("/sys/class/udc/")
	if err != nil {
		log.Errorf("read udc directory failed: %s", err)
		return err
	}

	for _, device := range devices {
		_, err = f.WriteString(device.Name() + "\n")
		if err != nil {
			log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
			return err
		}
	}

	log.Debugf("reset hid success")
	return nil
}

func (s *Service) Reset(c *gin.Context) {
	var rsp proto.Response
	if err := s.resetHID(); err != nil {
		rsp.ErrRsp(c, -1, "hid reset failed")
		return
	}
	rsp.OkRsp(c)
}

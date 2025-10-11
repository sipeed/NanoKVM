package hid

import (
	"NanoKVM-Server/proto"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) Reset(c *gin.Context) {
	var rsp proto.Response

	h := GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	// reset USB
	if err := disable(); err != nil {
		log.Errorf("disable hid failed: %s", err)
		rsp.ErrRsp(c, -1, "disable hid failed")
		return
	}

	if err := enable(); err != nil {
		log.Errorf("enable hid failed: %s", err)
		rsp.ErrRsp(c, -1, "enable hid failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("reset hid success")
}

func disable() (error) {
	// reset USB
	f, err := os.OpenFile("/sys/kernel/config/usb_gadget/g0/UDC", os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	err = f.Truncate(0)
	if err != nil {
		_ = f.Close()
		log.Errorf("truncate /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	_, err = f.Seek(0, 0)
	if err != nil {
		_ = f.Close()
		log.Errorf("seek to 0 failed: %s", err)
		return err
	}
	_, err = f.WriteString("\n")
	if err != nil {
		_ = f.Close()
		log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	_ = f.Close()

	time.Sleep(1 * time.Second)

	return nil
}

func enable() (error) {
	devices, err := os.ReadDir("/sys/class/udc/")
	if err != nil {
		log.Errorf("read udc directory failed: %s", err)
		return err
	}

	f, err := os.OpenFile("/sys/kernel/config/usb_gadget/g0/UDC", os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		return err
	}
	for _, device := range devices {
		_, err = f.WriteString(device.Name() + "\n")
		if err != nil {
			_ = f.Close()
			log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
			return err
		}
	}

	_ = f.Close()

	return nil
}

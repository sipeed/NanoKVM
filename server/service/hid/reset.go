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

	// reset USB
	f, err := os.OpenFile("/sys/kernel/config/usb_gadget/g0/UDC", os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		rsp.ErrRsp(c, -1, "open usb gadget file failed")
		return
	}
	err = f.Truncate(0)
	if err != nil {
		_ = f.Close()
		log.Errorf("truncate /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		rsp.ErrRsp(c, -1, "truncate usb gadget file failed")
		return
	}
	_, err = f.Seek(0, 0)
	if err != nil {
		_ = f.Close()
		log.Errorf("seek to 0 failed: %s", err)
		rsp.ErrRsp(c, -1, "seek to 0 in usb gadget file failed")
		return
	}
	_, err = f.WriteString("\n")
	if err != nil {
		_ = f.Close()
		log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		rsp.ErrRsp(c, -1, "write to usb gadget file failed")
		return
	}
	_ = f.Close()

	time.Sleep(1 * time.Second)

	devices, err := os.ReadDir("/sys/class/udc/")
	if err != nil {
		log.Errorf("read udc directory failed: %s", err)
		rsp.ErrRsp(c, -1, "read udc directory failed")
		return
	}

	f, err = os.OpenFile("/sys/kernel/config/usb_gadget/g0/UDC", os.O_WRONLY, 0644)
	if err != nil {
		log.Errorf("open /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
		rsp.ErrRsp(c, -1, "open usb gadget file failed")
		return
	}
	for _, device := range devices {
		_, err = f.WriteString(device.Name() + "\n")
		if err != nil {
			_ = f.Close()
			log.Errorf("write to /sys/kernel/config/usb_gadget/g0/UDC failed: %s", err)
			rsp.ErrRsp(c, -1, "write to usb gadget file failed")
			return
		}
	}

	_ = f.Close()

	rsp.OkRsp(c)
	log.Debugf("reset hid success")
}

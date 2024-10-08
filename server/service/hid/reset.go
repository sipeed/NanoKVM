package hid

import (
	"NanoKVM-Server/proto"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"os/exec"
)

func (s *Service) Reset(c *gin.Context) {
	var rsp proto.Response

	// reset USB
	commands := []string{
		"echo > /sys/kernel/config/usb_gadget/g0/UDC",
		"ls /sys/class/udc/ | cat > /sys/kernel/config/usb_gadget/g0/UDC",
	}

	for _, command := range commands {
		err := exec.Command("sh", "-c", command).Run()
		if err != nil {
			rsp.ErrRsp(c, -2, "execute command failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("reset hid success")
}

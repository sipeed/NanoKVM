package vm

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	udcDisableFile = "/boot/udc.disable"
)

var (
	udcEnableCommands = []string{
		"rm /boot/udc.disable",
		"/etc/init.d/S03usbdev restart",
	}

	udcDisableCommands = []string{
		"touch /boot/udc.disable",
		"/etc/init.d/S03usbdev restart",
	}
)

func runCommands(commands []string) error {
	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	for _, command := range commands {
		if err := exec.Command("sh", "-c", command).Run(); err != nil {
			log.Errorf("failed to run command '%s': %v", command, err)
			return err
		}
	}
	return nil
}

func (s *Service) EnableUsb(c *gin.Context) {
	var rsp proto.Response

	err := runCommands(udcEnableCommands)
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to enable USB")
		return
	}

	rsp.OkRsp(c)
	log.Debug("enable usb")
}

func (s *Service) DisableUsb(c *gin.Context) {
	var rsp proto.Response

	err := runCommands(udcDisableCommands)
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to disable USB")
		return
	}

	rsp.OkRsp(c)
	log.Debug("disable usb")
}

func (s *Service) GetUsbState(c *gin.Context) {
	var rsp proto.Response

	usbEnabled := false
	if _, err := os.Stat(udcDisableFile); err != nil {
		usbEnabled = true
	}

	rsp.OkRspWithData(c, &proto.GetUsbStateRsp{
		Enabled: usbEnabled,
	})

	log.Debug("get usb state")
}

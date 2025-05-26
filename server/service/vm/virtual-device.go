package vm

import (
	"errors"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
)

const (
	virtualNetwork = "/boot/usb.rndis0"
	virtualMedia   = "/boot/usb.disk0"
	virtualDisk    = "/boot/usb.disk1"
)

var (
	mountNetworkCommands = []string{
		"touch /boot/usb.rndis0",
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}

	unmountNetworkCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"rm -rf /sys/kernel/config/usb_gadget/g0/configs/c.1/rndis.usb0",
		"rm /boot/usb.rndis0",
		"/etc/init.d/S03usbdev start",
	}

	mountMediaCommands = []string{
		"touch /boot/usb.disk0",
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}

	unmountMediaCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"rm -rf /sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk0",
		"rm /boot/usb.disk0",
		"/etc/init.d/S03usbdev start",
	}

	mountDiskCommands = []string{
		"touch /boot/usb.disk1",
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}

	unmountDiskCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"rm -rf /sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk1",
		"rm /boot/usb.disk1",
		"/etc/init.d/S03usbdev start",
	}
)

func (s *Service) GetVirtualDevice(c *gin.Context) {
	var rsp proto.Response

	network, _ := isDeviceExist(virtualNetwork)
	media, _ := isDeviceExist(virtualMedia)
	disk, _ := isDeviceExist(virtualDisk)

	rsp.OkRspWithData(c, &proto.GetVirtualDeviceRsp{
		Network: network,
		Media:   media,
		Disk:    disk,
	})
	log.Debugf("get virtual device success")
}

func (s *Service) UpdateVirtualDevice(c *gin.Context) {
	var req proto.UpdateVirtualDeviceReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid argument")
		return
	}

	var device string
	var commands []string

	switch req.Device {
	case "network":
		device = virtualNetwork

		exist, _ := isDeviceExist(device)
		if !exist {
			commands = mountNetworkCommands
		} else {
			commands = unmountNetworkCommands
		}
	case "media":
		device = virtualMedia

		exist, _ := isDeviceExist(device)
		if !exist {
			commands = mountMediaCommands
		} else {
			commands = unmountMediaCommands
		}
	case "disk":
		device = virtualDisk

		exist, _ := isDeviceExist(device)
		if !exist {
			commands = mountDiskCommands
		} else {
			commands = unmountDiskCommands
		}
	default:
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	for _, command := range commands {
		err := exec.Command("sh", "-c", command).Run()
		if err != nil {
			rsp.ErrRsp(c, -3, "operation failed")
			return
		}
	}

	on, _ := isDeviceExist(device)
	rsp.OkRspWithData(c, &proto.UpdateVirtualDeviceRsp{
		On: on,
	})

	log.Debugf("update virtual device %s success", req.Device)
}

func isDeviceExist(device string) (bool, error) {
	_, err := os.Stat(device)

	if err == nil {
		return true, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}

	log.Errorf("check file %s err: %s", device, err)
	return false, err
}

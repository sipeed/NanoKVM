package vm

import (
	"errors"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/storage"
)

const (
	virtualNetwork = "/boot/usb.rndis0"
	virtualDisk    = "/boot/usb.disk0"
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

	mountDiskCommands = []string{
		"touch /boot/usb.disk0",
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}

	unmountDiskCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"rm -rf /sys/kernel/config/usb_gadget/g0/configs/c.1/mass_storage.disk0",
		"rm /boot/usb.disk0",
		"/etc/init.d/S03usbdev start",
	}
)

func (s *Service) GetVirtualDevice(c *gin.Context) {
	var rsp proto.Response

	network, _ := isDeviceExist(virtualNetwork)

	rsp.OkRspWithData(c, &proto.GetVirtualDeviceRsp{
		Network: network,
		Disk:    diskAttached(),
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
	case "disk":
		device = virtualDisk

		if diskAttached() {
			commands = unmountDiskCommands
		} else {
			// the host writes the partition from now on. A mounted image is released by
			// the restarted gadget, which attaches the raw partition again.
			if err := storage.SetDataWritable(false); err != nil {
				log.Errorf("make /data read-only failed: %s", err)
				rsp.ErrRsp(c, -3, "make /data read-only failed")
				return
			}

			commands = mountDiskCommands
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

	// the disk is gone from the host, the KVM writes /data itself again
	if device == virtualDisk && !diskAttached() {
		if err := storage.SetDataWritable(true); err != nil {
			log.Errorf("make /data writable failed: %s", err)
		}
	}

	on, _ := isDeviceExist(device)
	rsp.OkRspWithData(c, &proto.UpdateVirtualDeviceRsp{
		On: on,
	})

	log.Debugf("update virtual device %s success", req.Device)
}

// diskAttached reports whether the virtual disk is enabled and the /data
// partition is currently shared with the host. A virtual disk that serves an
// image, or nothing at all, counts as disabled.
func diskAttached() bool {
	enabled, _ := isDeviceExist(virtualDisk)
	return enabled && storage.DataDiskAttached()
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

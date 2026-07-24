package vm

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
)

const (
	virtualNetwork = "/boot/usb.rndis0"
	virtualDisk    = "/boot/usb.disk0"
	virtualSerial  = "/boot/usb.acm"
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
	disk, _ := isDeviceExist(virtualDisk)
	serial, _ := isDeviceExist(virtualSerial)

	rsp.OkRspWithData(c, &proto.GetVirtualDeviceRsp{
		Network: network,
		Disk:    disk,
		Serial:  serial,
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

	if req.Device == "serial" {
		s.updateUsbSerial(c)
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

// updateUsbSerial toggles the USB CDC ACM virtual serial port.
//
// Enabling implies HID-Only mode because adding the ACM endpoint to the
// standard composite gadget exceeds the SG2002/dwc2 FIFO budget — only
// keyboard + mouse + ACM fits. We therefore swap to the HID-only init
// script when needed, write /boot/usb.acm, and reboot.
//
// Disabling removes the flag and reboots. HID-Only mode is left alone;
// the user toggles it back to normal separately if they want
// network/mass-storage back.
func (s *Service) updateUsbSerial(c *gin.Context) {
	var rsp proto.Response

	exist, _ := isDeviceExist(virtualSerial)
	enable := !exist

	if enable {
		// Always overwrite /etc/init.d/S03usbdev with the hid-only script.
		// We can't use hid.SwitchMode here: its short-circuit relies on
		// bcdDevice as the mode marker, and on some firmware the kernel
		// default for bcdDevice already matches the hid-only marker, so
		// SwitchMode incorrectly thinks no swap is needed.
		if err := hid.CopyModeFile(hid.ModeHidOnlyScript); err != nil {
			log.Errorf("failed to copy hid-only script: %s", err)
			rsp.ErrRsp(c, -3, "operation failed")
			return
		}
		if err := os.WriteFile(virtualSerial, []byte{}, 0o644); err != nil {
			log.Errorf("failed to create %s: %s", virtualSerial, err)
			rsp.ErrRsp(c, -3, "operation failed")
			return
		}
		// The firmware's inittab runs a getty on ttyGS0 to expose the NanoKVM
		// shell over serial. Remove it so the web terminal has exclusive access.
		// Restored on disable below.
		if err := exec.Command("sed", "-i", "/^acm::respawn/d", "/etc/inittab").Run(); err != nil {
			log.Warnf("failed to remove acm getty from inittab: %s", err)
		}
	} else {
		if err := os.Remove(virtualSerial); err != nil && !errors.Is(err, os.ErrNotExist) {
			log.Errorf("failed to remove %s: %s", virtualSerial, err)
			rsp.ErrRsp(c, -3, "operation failed")
			return
		}
		// Restore the NanoKVM's own ttyGS0 getty if it was removed.
		restore := "acm::respawn:/sbin/getty -L ttyGS0 0 vt100 -l /etc/ttyGS0_handler.sh"
		cmd := fmt.Sprintf("grep -qF 'acm::respawn' /etc/inittab || echo '%s' >> /etc/inittab", restore)
		if err := exec.Command("sh", "-c", cmd).Run(); err != nil {
			log.Warnf("failed to restore acm getty in inittab: %s", err)
		}
	}

	rsp.OkRspWithData(c, &proto.UpdateVirtualDeviceRsp{
		On: enable,
	})
	log.Printf("usb serial %v, rebooting", enable)

	time.Sleep(500 * time.Millisecond)
	_ = exec.Command("reboot").Run()
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

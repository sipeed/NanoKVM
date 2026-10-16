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
	preparePartition := false

	// A caller that says which state it wants gets that state; a caller that
	// does not is toggling, the way this endpoint has always worked.
	switch req.Device {
	case "network":
		device = virtualNetwork

		exist, _ := isDeviceExist(device)
		enable := !exist
		if req.Enable != nil {
			enable = *req.Enable
		}
		if enable && !exist {
			commands = mountNetworkCommands
		} else if !enable && exist {
			commands = unmountNetworkCommands
		}
		if len(commands) > 0 {
			// Restarting the gadget for a network change also makes the boot
			// script attach whatever /boot/usb.disk0 names. When the virtual
			// disk is enabled that is the raw data partition by default, so
			// this transition needs the same protection as a disk mount.
			diskEnabled, err := isDeviceExist(virtualDisk)
			if err != nil {
				rsp.ErrRsp(c, -3, "check virtual disk failed")
				return
			}
			preparePartition = diskEnabled
		}
	case "disk":
		device = virtualDisk

		// The settings switch toggles: it reads "on" only while the raw
		// partition is served, so turning it on while an image is mounted
		// cancels that mount, which the UI confirms first. An explicit enable
		// is a request for the virtual disk to exist at all, so it compares
		// against that instead and leaves a served image alone.
		enabled, err := isDeviceExist(device)
		if err != nil {
			rsp.ErrRsp(c, -3, "check virtual disk failed")
			return
		}
		current := diskAttached()
		enable := !current
		if req.Enable != nil {
			current = enabled
			enable = *req.Enable
		}
		// Asking for the state that already holds changes nothing: a caller
		// that says "enable" must not switch off a running share.
		if enable != current {
			if current {
				commands = unmountDiskCommands
			} else {
				// The restarted gadget attaches the raw partition. The actual
				// read-only transition happens under the media operation lock
				// below, before any script can expose the partition.
				preparePartition = true
				commands = mountDiskCommands
			}
		}
	default:
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if len(commands) > 0 && (device == virtualDisk || preparePartition) {
		unlock, err := storage.LockVirtualDiskTransition()
		if err != nil {
			rsp.ErrRsp(c, -3, err.Error())
			return
		}
		defer unlock()

		if preparePartition {
			// The host writes the partition from now on. A mounted image is
			// released by the restarted gadget, which attaches the raw
			// partition again. This must happen before the script can expose
			// that partition, including when the script is changing networking.
			if err := storage.SetDataWritable(false); err != nil {
				log.Errorf("make /data read-only failed: %s", err)
				rsp.ErrRsp(c, -3, "make /data read-only failed")
				return
			}
		}
	}

	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	var commandErr error
	for _, command := range commands {
		if commandErr = exec.Command("sh", "-c", command).Run(); commandErr != nil {
			log.Errorf("run %q failed: %s", command, commandErr)
			break
		}
	}

	// Whatever the scripts got to, /data belongs to this side again unless
	// the raw partition really is served to the target machine now. That
	// covers a failed script, which may have stopped before re-attaching the
	// partition it was made read-only for, and a network change, after which
	// the restarted gadget may serve the partition or not.
	if len(commands) > 0 && (device == virtualDisk || preparePartition) && !diskAttached() {
		if err := storage.SetDataWritable(true); err != nil {
			log.Errorf("make /data writable failed: %s", err)
		}
	}

	if commandErr != nil {
		rsp.ErrRsp(c, -3, "operation failed")
		return
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

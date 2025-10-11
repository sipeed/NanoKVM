package hid

import (
	"NanoKVM-Server/proto"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	ModeNormal  = "normal"
	ModeHidOnly = "hid-only"
	ModeFlag    = "/sys/kernel/config/usb_gadget/g0/bcdDevice"

	ModeNormalScript  = "/kvmapp/system/init.d/S03usbdev"
	ModeHidOnlyScript = "/kvmapp/system/init.d/S03usbhid"

	USBDevScript = "/etc/init.d/S03usbdev"
)

var modeMap = map[string]string{
	"0x0510": ModeNormal,
	"0x0623": ModeHidOnly,
}

func (s *Service) GetHidMode(c *gin.Context) {
	var rsp proto.Response

	mode, err := getHidMode()
	if err != nil {
		rsp.ErrRsp(c, -1, "get HID mode failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetHidModeRsp{
		Mode: mode,
	})
	log.Debugf("get hid mode: %s", mode)
}

func (s *Service) SetHidMode(c *gin.Context) {
	var req proto.SetHidModeReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	if req.Mode != ModeNormal && req.Mode != ModeHidOnly {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if mode, _ := getHidMode(); req.Mode == mode {
		rsp.OkRsp(c)
		return
	}

	h := GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	srcScript := ModeNormalScript
	if req.Mode == ModeHidOnly {
		srcScript = ModeHidOnlyScript
	}

	if err := copyModeFile(srcScript); err != nil {
		rsp.ErrRsp(c, -3, "operation failed")
		return
	}

	rsp.OkRsp(c)

	log.Println("reboot system...")
	time.Sleep(500 * time.Millisecond)
	_ = exec.Command("reboot").Run()
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

func (s *Service) ResetHid(c *gin.Context) {
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

func copyModeFile(srcScript string) error {
	// open the source file
	srcFile, err := os.Open(srcScript)
	if err != nil {
		log.Errorf("failed to open %s: %s", srcScript, err)
		return err
	}
	defer func() {
		_ = srcFile.Close()
	}()

	srcInfo, err := srcFile.Stat()
	if err != nil {
		log.Errorf("failed to get %s info: %s", srcScript, err)
		return err
	}

	// create and copy to temporary file
	tmpFile, err := os.CreateTemp("/etc/init.d/", ".S03usbdev-")
	if err != nil {
		log.Errorf("failed to create temp %s: %s", USBDevScript, err)
		return err
	}
	tmpPath := tmpFile.Name()
	defer func() {
		_ = os.Remove(tmpPath)
	}()
	log.Debugf("create temporary file: %s", tmpPath)

	if err := tmpFile.Chmod(srcInfo.Mode()); err != nil {
		_ = tmpFile.Close()
		log.Errorf("failed to set %s mode: %s", tmpPath, err)
		return err
	}

	if _, err := io.Copy(tmpFile, srcFile); err != nil {
		_ = tmpFile.Close()
		log.Errorf("failed to copy %s: %s", srcScript, err)
		return err
	}

	if err := tmpFile.Sync(); err != nil {
		_ = tmpFile.Close()
		log.Errorf("failed to sync %s: %s", tmpPath, err)
		return err
	}

	if err := tmpFile.Close(); err != nil {
		log.Errorf("failed to close %s: %s", tmpPath, err)
		return err
	}

	// replace the target file with the temporary file
	if err := os.Rename(tmpPath, USBDevScript); err != nil {
		log.Errorf("failed to rename %s: %s", tmpPath, err)
		return err
	}

	log.Debugf("copy %s to %s successful", srcScript, USBDevScript)
	return nil
}

func getHidMode() (string, error) {
	data, err := os.ReadFile(ModeFlag)
	if err != nil {
		log.Errorf("failed to read %s: %s", ModeFlag, err)
		return "", err
	}

	key := strings.TrimSpace(string(data))
	mode, ok := modeMap[key]
	if !ok {
		log.Errorf("invalid mode flag: %s", key)
		return "", errors.New("invalid mode flag")
	}

	return mode, nil
}

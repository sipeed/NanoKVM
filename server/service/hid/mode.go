package hid

import (
	"NanoKVM-Server/proto"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	ModeNormal  = "normal"
	ModeHidOnly = "hid-only"
	ModeKbdOnly = "kbd-only"

	ModeNonBios = "normal"
	ModeHidBios = "bios"

	HidGadgetPath     = "/sys/kernel/config/usb_gadget/g0"
	HidConfPath       = "/sys/kernel/config/usb_gadget/g0/configs/c.1"
	HidFuncPath       = "/sys/kernel/config/usb_gadget/g0/functions"
	ModeFlag          = "/sys/kernel/config/usb_gadget/g0/bcdDevice"
	NormalModeScript  = "/kvmapp/system/init.d/S03usbdev"
	HidOnlyModeScript = "/kvmapp/system/init.d/S03usbhid"
	TargetModeScript  = "/etc/init.d/S03usbdev"
)

var modeMap = map[string]string{
	"0x0510": ModeNormal,
	"0x0623": ModeHidOnly,
	"0x0102": ModeKbdOnly,
}

var biosMap = map[string]string{
	"0": ModeNonBios,
	"1": ModeHidBios,
}

var funcMap = map[string]string{
	"mass_storage.disk0": "/boot/usb.disk0",
	"ncm.usb0": "/boot/usb.ncm",
	"rndis.usb0": "/boot/usb.rndis0",
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

	srcScript := NormalModeScript
	if req.Mode == ModeHidOnly {
		srcScript = HidOnlyModeScript
	}

	if err := copyModeFile(srcScript); err != nil {
		rsp.ErrRsp(c, -3, "operation failed")
		return
	}

	biosmode, _ := getBiosMode();

	msg, err := setHidMode(req.Mode, biosmode)
	if err != nil {
		rsp.ErrRsp(c, -4, msg)
		return
	}

	rsp.OkRsp(c)
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
		log.Errorf("failed to create temp %s: %s", TargetModeScript, err)
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
	if err := os.Rename(tmpPath, TargetModeScript); err != nil {
		log.Errorf("failed to rename %s: %s", tmpPath, err)
		return err
	}

	log.Debugf("copy %s to %s successful", srcScript, TargetModeScript)
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

func setHidMode(hidmode, biosmode string) (string, error) {
	h := GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	if err := disable(); err != nil {
		log.Errorf("disable hid failed: %s", err)
		return "disable hid failed", err
	}

	flag := "0"
	if biosmode == ModeHidBios {
		flag = "1"
	}

	for _, hidfunc := range []string{"hid.GS0", "hid.GS1", "hid.GS2"} {
		hidFunction := fmt.Sprintf("%s/%s", HidFuncPath, hidfunc)
		hidSymLink := fmt.Sprintf("%s/%s", HidConfPath, hidfunc)
		hidBiosFlag := fmt.Sprintf("%s/subclass", hidFunction)
		hidFuncOn, _ := isFuncExist(hidFunction)
		hidConfOn, _ := isFuncExist(hidSymLink)

		if hidConfOn {
			if err := os.Remove(hidSymLink); err != nil {
				log.Fatalf("Could not remove symlink: %v", err)
				return "unlink hid failed", err
			}
		}

		// bios mode
		if err := os.WriteFile(hidBiosFlag, []byte(flag), 0o666); err != nil {
			log.Errorf("set bios mode failed: %s", err)
			return "set bios mode failed", err
		}

		if hidFuncOn {
			if err := os.Symlink(hidFunction, hidSymLink); err != nil {
				log.Errorf("Could not create symlink: %v", err)
				return "symlink hid failed", err
			}
		}
	}

	usbFlag := "0x0200"
	devFlag := "0x0510"
	idVen := "0x3346"
	idPrd := "0x1009"
	maxPkt := "0x40"
	strVen := "sipeed"
	strPrd := "NanoKVM"
	if hidmode == ModeHidOnly {
		usbFlag = "0x0101"
		devFlag = "0x0623"
	} else if hidmode == ModeKbdOnly {
		usbFlag = "0x0001"
		devFlag = "0x0102"
		idVen = "0x05ac"
		idPrd = "0x0202"
		maxPkt = "0x08"
		strVen = "Alps Electric"
		strPrd = "Apple USB Keyboard"
	}

	hidBcdUsb := fmt.Sprintf("%s/%s", HidGadgetPath, "bcdUSB")
	hidBcdDev := fmt.Sprintf("%s/%s", HidGadgetPath, "bcdDevice")
	hidIdVen := fmt.Sprintf("%s/%s", HidGadgetPath, "idVendor")
	hidIdPrd := fmt.Sprintf("%s/%s", HidGadgetPath, "idProduct")
	hidMaxPkt := fmt.Sprintf("%s/%s", HidGadgetPath, "bMaxPacketSize0")
	hidStrVen := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409/manufacturer")
	hidStrPrd := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409/product")

	if err := os.WriteFile(hidBcdUsb, []byte(usbFlag), 0o666); err != nil {
		log.Errorf("set bcdUSB failed: %s", err)
		return "set bcdUSB failed", err
	}

	if err := os.WriteFile(hidBcdDev, []byte(devFlag), 0o666); err != nil {
		log.Errorf("set bcdDevice failed: %s", err)
		return "set bcdDevice failed", err
	}

	if err := os.WriteFile(hidIdVen, []byte(idVen), 0o666); err != nil {
		log.Errorf("set idVendor failed: %s", err)
		return "set idVendor failed", err
	}

	if err := os.WriteFile(hidIdPrd, []byte(idPrd), 0o666); err != nil {
		log.Errorf("set idProduct failed: %s", err)
		return "set idProduct failed", err
	}

	if err := os.WriteFile(hidMaxPkt, []byte(maxPkt), 0o666); err != nil {
		log.Errorf("set bMaxPacketSize0 failed: %s", err)
		return "set bMaxPacketSize0 failed", err
	}

	if err := os.WriteFile(hidStrVen, []byte(strVen), 0o666); err != nil {
		log.Errorf("set strings/0x409/manufacturer failed: %s", err)
		return "set strings/0x409/manufacturer failed", err
	}

	if err := os.WriteFile(hidStrPrd, []byte(strPrd), 0o666); err != nil {
		log.Errorf("set strings/0x409/product failed: %s", err)
		return "set strings/0x409/product failed", err
	}

	bmAttr := "0xE0"
	maxPwr := "120"
	strCnf := "NanoKVM"
	if hidmode == ModeHidOnly {
		bmAttr = "0xA0"
		maxPwr = "200"
	} else if hidmode == ModeKbdOnly {
		bmAttr = "0xA0"
		maxPwr = "50"
		strCnf = ""
	}

	hidBmAttr := fmt.Sprintf("%s/%s", HidConfPath, "bmAttributes")
	hidMaxPwr := fmt.Sprintf("%s/%s", HidConfPath, "MaxPower")
	hidStrCnf := fmt.Sprintf("%s/%s", HidConfPath, "strings/0x409/configuration")

	if err := os.WriteFile(hidBmAttr, []byte(bmAttr), 0o666); err != nil {
		log.Errorf("set bmAttributes failed: %s", err)
		return "set bmAttributes failed", err
	}

	if err := os.WriteFile(hidMaxPwr, []byte(maxPwr), 0o666); err != nil {
		log.Errorf("set MaxPower failed: %s", err)
		return "set MaxPower failed", err
	}

	if err := os.WriteFile(hidStrCnf, []byte(strCnf), 0o666); err != nil {
		log.Errorf("set strings/0x409/configuration failed: %s", err)
		return "set strings/0x409/configuration failed", err
	}

	// configure non-hid functions
	for _, othfunc := range []string{"mass_storage.disk0", "ncm.usb0", "rndis.usb0"} {
		othFunction := fmt.Sprintf("%s/%s", HidFuncPath, othfunc)
		othSymLink := fmt.Sprintf("%s/%s", HidConfPath, othfunc)
		othFuncOn, _ := isFuncExist(othFunction)
		othConfOn, _ := isFuncExist(othSymLink)

		bootFile, othFuncEn := funcMap[othfunc]
		if othFuncEn {
			othFuncEn, _ = isFuncExist(bootFile)
		}
		if othFuncEn && !othFuncOn && hidmode == ModeNormal {
			if err := os.Mkdir(othFunction, 0o755); err != nil {
				log.Fatalf("Could create function: %v", err)
				return "create function failed", err
			}
			othFuncOn, _ = isFuncExist(othFunction)
		}
		if othFuncOn && othfunc == "mass_storage.disk0" {
			removableFlag := fmt.Sprintf("%s/%s", othFunction, "lun.0/removable")

			if err := os.WriteFile(removableFlag, []byte("1"), 0o666); err != nil {
				log.Errorf("set removable failed: %s", err)
				return "set removable failed", err
			}
		}

		if othFuncOn && othConfOn && hidmode != ModeNormal {
			if err := os.Remove(othSymLink); err != nil {
				log.Fatalf("Could not remove symlink: %v", err)
				return "unlink function failed", err
			}
		} else if othFuncOn && !othConfOn && hidmode == ModeNormal {
			if err := os.Symlink(othFunction, othSymLink); err != nil {
				log.Errorf("Could not create symlink: %v", err)
				return "symlink function failed", err
			}
		}
	}

	if err := enable(); err != nil {
		log.Errorf("enable hid failed: %s", err)
		return "enable hid failed", err
	}

	return "", nil
}

func getBiosMode() (string, error) {
	hidFunction := fmt.Sprintf("%s/%s", HidConfPath, "hid.GS0")
	hidBiosFlag := fmt.Sprintf("%s/subclass", hidFunction)

	data, err := os.ReadFile(hidBiosFlag)
	if err != nil {
		log.Errorf("failed to read %s: %s", hidBiosFlag, err)
		return "", err
	}

	key := strings.TrimSpace(string(data))
	mode, ok := biosMap[key]
	if !ok {
		log.Errorf("invalid bios flag: %s", key)
		return "", errors.New("invalid bios flag")
	}

	return mode, nil
}

func isFuncExist(device string) (bool, error) {
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

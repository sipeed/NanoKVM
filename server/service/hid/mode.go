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
	KbdOnlyModeScript = "/kvmapp/system/init.d/S03usbkeyboard"
	TargetModeScript  = "/etc/init.d/S03usbdev"

	BiosFile          = "/boot/BIOS"
	NoHidFile         = "/boot/disable_hid"
	NoWowFile         = "/boot/usb.notwakeup"
	UsbIdVenFile      = "/boot/usb.vid"
	UsbIdPrdFile      = "/boot/usb.pid"
)

type hidConf struct {
	Protocol []byte
	ReportLength []byte
	ReportDesc []byte
}

var modeMap = map[string]string{
	"0x0510": ModeNormal,
	"0x0623": ModeHidOnly,
	"0x0102": ModeKbdOnly,
}

var biosMap = map[string]string{
	"0": ModeNonBios,
	"1": ModeHidBios,
}

var confMap = map[string]hidConf{
	// keyboard
	"hid.GS0": { []byte("1"), []byte("8"), []byte( "\x05\x01\x09\x06\xa1\x01\x05\x07\x19\xe0\x29\xe7\x15\x00\x25\x01\x75\x01\x95\x08\x81\x02\x95\x01\x75\x08\x81\x03\x95\x05\x75\x01\x05\x08\x19\x01\x29\x05\x91\x02\x95\x01\x75\x03\x91\x03\x95\x06\x75\x08\x15\x00\x25\x65\x05\x07\x19\x00\x29\x65\x81\x00\xc0" ) },
	// mouse
	"hid.GS1": { []byte("2"), []byte("4"), []byte( "\x05\x01\x09\x02\xa1\x01\x09\x01\xa1\x00\x05\x09\x19\x01\x29\x03\x15\x00\x25\x01\x95\x03\x75\x01\x81\x02\x95\x01\x75\x05\x81\x03\x05\x01\x09\x30\x09\x31\x09\x38\x15\x81\x25\x7f\x75\x08\x95\x03\x81\x06\xc0\xc0" ) },
	// touch
	"hid.GS2": { []byte("2"), []byte("6"), []byte( "\x05\x01\x09\x02\xa1\x01\x09\x01\xa1\x00\x05\x09\x19\x01\x29\x03\x15\x00\x25\x01\x95\x03\x75\x01\x81\x02\x95\x01\x75\x05\x81\x01\x05\x01\x09\x30\x09\x31\x15\x00\x26\xff\x7f\x35\x00\x46\xff\x7f\x75\x10\x95\x02\x81\x02\x05\x01\x09\x38\x15\x81\x25\x7f\x35\x00\x45\x00\x75\x08\x95\x01\x81\x06\xc0\xc0" ) },
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
	if req.Mode != ModeNormal && req.Mode != ModeHidOnly && req.Mode != ModeKbdOnly {
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
	} else if req.Mode == ModeKbdOnly {
		srcScript = KbdOnlyModeScript
	}

	if err := copyModeFile(srcScript); err != nil {
		rsp.ErrRsp(c, -3, "operation failed")
		return
	}

	bootHidOff, _ := isFuncExist(NoHidFile)
	if bootHidOff {
		if err := os.Remove(NoHidFile); err != nil {
			log.Errorf("remove disable hid file failed: %s", err)
			rsp.ErrRsp(c, -2, "remove disable hid file failed")
			return
		}
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
	hidGadgetOn, _ := isFuncExist(HidGadgetPath)

	// gadget is disabled
	if (!hidGadgetOn) {
		return modeMap["0x0510"], nil
	}

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

	hidGadgetOn, _ := isFuncExist(HidGadgetPath)
	if !hidGadgetOn {
		if err := os.Mkdir(HidGadgetPath, 0o755); err != nil {
			log.Fatalf("Could not create gadget: %v", err)
			return "create gadget failed", err
		}
		//hidGadgetOn, _ = isFuncExist(HidGadgetPath)
	}
	hidGadgStrPath := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409")
	hidGadgetStringsOn, _ := isFuncExist(hidGadgStrPath)
	if !hidGadgetStringsOn {
		if err := os.Mkdir(hidGadgStrPath, 0o755); err != nil {
			log.Fatalf("Could not create config: %v", err)
			return "create config failed", err
		}
		//hidGadgetStringsOn, _ = isFuncExist(hidGadgStrPath)
	}

	hidConfigOn, _ := isFuncExist(HidConfPath)
	if !hidConfigOn {
		if err := os.Mkdir(HidConfPath, 0o755); err != nil {
			log.Fatalf("Could not create config: %v", err)
			return "create config failed", err
		}
		//hidConfigOn, _ = isFuncExist(HidConfPath)
	}
	hidConfStrPath := fmt.Sprintf("%s/%s", HidConfPath, "strings/0x409")
	hidConfigStringsOn, _ := isFuncExist(hidConfStrPath)
	if !hidConfigStringsOn {
		if err := os.Mkdir(hidConfStrPath, 0o755); err != nil {
			log.Fatalf("Could not create config: %v", err)
			return "create config failed", err
		}
		//hidConfigStringsOn, _ = isFuncExist(hidConfStrPath)
	}

	flag := "0"
	if biosmode == ModeHidBios {
		flag = "1"
	}
	wowFlag := "1"
	wowDisabled, _ := isFuncExist(NoWowFile)
	if wowDisabled {
		wowFlag = "0"
	}

	for _, hidfunc := range []string{"hid.GS0", "hid.GS1", "hid.GS2"} {
		hidFunction := fmt.Sprintf("%s/%s", HidFuncPath, hidfunc)
		hidSymLink := fmt.Sprintf("%s/%s", HidConfPath, hidfunc)
		hidProtocol := fmt.Sprintf("%s/protocol", hidFunction)
		hidLength   := fmt.Sprintf("%s/report_length", hidFunction)
		hidReport   := fmt.Sprintf("%s/report_desc", hidFunction)
		hidBiosFlag := fmt.Sprintf("%s/subclass", hidFunction)
		hidWakeOnWr := fmt.Sprintf("%s/wakeup_on_write", hidFunction)
		hidFuncOn, _ := isFuncExist(hidFunction)
		hidConfOn, _ := isFuncExist(hidSymLink)
		hidConfig, _ := confMap[hidfunc]

		if hidConfOn {
			if err := os.Remove(hidSymLink); err != nil {
				log.Fatalf("Could not remove symlink: %v", err)
				return "unlink hid failed", err
			}
		}

		if  hidfunc != "hid.GS0" && hidmode == ModeKbdOnly {
			continue
		}

		if !hidFuncOn {
			if err := os.Mkdir(hidFunction, 0o755); err != nil {
				log.Fatalf("Could not create function: %v", err)
				return "create function failed", err
			}
			hidFuncOn, _ = isFuncExist(hidFunction)
		}

		if err := os.WriteFile(hidProtocol, hidConfig.Protocol, 0o666); err != nil {
			log.Errorf("set protocol failed: %s", err)
			return "set protocol failed", err
		}
		if err := os.WriteFile(hidLength, hidConfig.ReportLength, 0o666); err != nil {
			log.Errorf("set report length failed: %s", err)
			return "set report length failed", err
		}
		if err := os.WriteFile(hidReport, hidConfig.ReportDesc, 0o666); err != nil {
			log.Errorf("set report desc failed: %s", err)
			return "set report desc failed", err
		}

		// bios mode
		if err := os.WriteFile(hidBiosFlag, []byte(flag), 0o666); err != nil {
			log.Errorf("set bios mode failed: %s", err)
			return "set bios mode failed", err
		}
		// wakeup on write
		if err := os.WriteFile(hidWakeOnWr, []byte(wowFlag), 0o666); err != nil {
			log.Errorf("set wakeup on write failed: %s", err)
			return "set wakeup on write failed", err
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
	strSNr := "0123456789ABCDEF"
	if hidmode == ModeHidOnly {
		usbFlag = "0x0101"
		devFlag = "0x0623"
		strSNr = ""
	} else if hidmode == ModeKbdOnly {
		usbFlag = "0x0001"
		devFlag = "0x0102"
		idVen = "0x05ac"
		idPrd = "0x0202"
		maxPkt = "0x08"
		strVen = "Alps Electric"
		strPrd = "Apple USB Keyboard"
		strSNr = ""
	}

	bootIdVen, _ := isFuncExist(UsbIdVenFile)
	bootIdPrd, _ := isFuncExist(UsbIdPrdFile)
	if bootIdVen && bootIdPrd {
		data, err := os.ReadFile(UsbIdVenFile)
		if err != nil {
			log.Errorf("failed to read %s: %s", UsbIdVenFile, err)
			return "", err
		}

		idVen = strings.TrimSpace(string(data))

		data, err = os.ReadFile(UsbIdPrdFile)
		if err != nil {
			log.Errorf("failed to read %s: %s", UsbIdPrdFile, err)
			return "", err
		}

		idPrd = strings.TrimSpace(string(data))
	}

	hidBcdUsb := fmt.Sprintf("%s/%s", HidGadgetPath, "bcdUSB")
	hidBcdDev := fmt.Sprintf("%s/%s", HidGadgetPath, "bcdDevice")
	hidIdVen := fmt.Sprintf("%s/%s", HidGadgetPath, "idVendor")
	hidIdPrd := fmt.Sprintf("%s/%s", HidGadgetPath, "idProduct")
	hidMaxPkt := fmt.Sprintf("%s/%s", HidGadgetPath, "bMaxPacketSize0")
	hidStrVen := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409/manufacturer")
	hidStrPrd := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409/product")
	hidStrSNr := fmt.Sprintf("%s/%s", HidGadgetPath, "strings/0x409/serialnumber")

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

	if err := os.WriteFile(hidStrSNr, []byte(strSNr), 0o666); err != nil {
		log.Errorf("set strings/0x409/serialnumber failed: %s", err)
		return "set strings/0x409/serialnumber failed", err
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
				log.Fatalf("Could not create function: %v", err)
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
	hidFuncOn, _ := isFuncExist(hidFunction)
	biosboot, _ := isFuncExist(BiosFile)

	// hid is disabled
	if (!hidFuncOn) {
		if biosboot {
			return biosMap["1"], nil
		} else {
			return biosMap["0"], nil
		}
	}

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

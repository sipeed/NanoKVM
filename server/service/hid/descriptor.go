package hid

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

const (
	gadgetDir        = "/sys/kernel/config/usb_gadget/g0"
	idVendorFile     = gadgetDir + "/idVendor"
	idProductFile    = gadgetDir + "/idProduct"
	manufacturerFile = gadgetDir + "/strings/0x409/manufacturer"
	productFile      = gadgetDir + "/strings/0x409/product"
	serialFile       = gadgetDir + "/strings/0x409/serialnumber"
	configStringFile = gadgetDir + "/configs/c.1/strings/0x409/configuration"
	udcFile          = gadgetDir + "/UDC"

	defaultVid          = "0x3346"
	defaultPid          = "0x1009"
	defaultManufacturer = "sipeed"
	defaultProduct      = "NanoKVM"
	defaultSerial       = "0123456789ABCDEF"
)

func readConfigFS(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(data)), nil
}

func writeConfigFS(path string, value string) error {
	return os.WriteFile(path, []byte(value), 0o666)
}

func (s *Service) GetUsbDescriptor(c *gin.Context) {
	var rsp proto.Response

	vid, err := readConfigFS(idVendorFile)
	if err != nil {
		log.Errorf("failed to read idVendor: %s", err)
		rsp.ErrRsp(c, -1, "failed to read USB descriptor")
		return
	}

	pid, err := readConfigFS(idProductFile)
	if err != nil {
		log.Errorf("failed to read idProduct: %s", err)
		rsp.ErrRsp(c, -1, "failed to read USB descriptor")
		return
	}

	manufacturer, err := readConfigFS(manufacturerFile)
	if err != nil {
		log.Errorf("failed to read manufacturer: %s", err)
		rsp.ErrRsp(c, -1, "failed to read USB descriptor")
		return
	}

	product, err := readConfigFS(productFile)
	if err != nil {
		log.Errorf("failed to read product: %s", err)
		rsp.ErrRsp(c, -1, "failed to read USB descriptor")
		return
	}

	serial, err := readConfigFS(serialFile)
	if err != nil {
		log.Errorf("failed to read serial: %s", err)
		rsp.ErrRsp(c, -1, "failed to read USB descriptor")
		return
	}

	descriptor := proto.UsbDescriptor{
		VendorName:   manufacturer,
		ProductName:  product,
		SerialNumber: serial,
		Vid:          vid,
		Pid:          pid,
	}

	rsp.OkRspWithData(c, &proto.GetUsbDescriptorRsp{
		Descriptor: descriptor,
	})
	log.Debugf("get USB descriptor: %+v", descriptor)
}

func (s *Service) SetUsbDescriptor(c *gin.Context) {
	var req proto.SetUsbDescriptorReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	h := GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	if err := rebindUDC(func() error {
		return writeDescriptorFiles(req.Vid, req.Pid, req.VendorName, req.ProductName, req.SerialNumber)
	}); err != nil {
		log.Errorf("failed to set USB descriptor: %s", err)
		rsp.ErrRsp(c, -2, "failed to set USB descriptor")
		return
	}

	persistBootFile("/boot/usb.vid", req.Vid)
	persistBootFile("/boot/usb.pid", req.Pid)
	persistBootFile("/boot/usb.manufacturer", req.VendorName)
	persistBootFile("/boot/usb.product", req.ProductName)
	persistBootFile("/boot/usb.serial", req.SerialNumber)

	rsp.OkRsp(c)
	log.Debugf("set USB descriptor success")
}

func (s *Service) RestoreUsbDefaults(c *gin.Context) {
	var rsp proto.Response

	h := GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	if err := rebindUDC(func() error {
		return writeDescriptorFiles(defaultVid, defaultPid, defaultManufacturer, defaultProduct, defaultSerial)
	}); err != nil {
		log.Errorf("failed to restore USB defaults: %s", err)
		rsp.ErrRsp(c, -2, "failed to restore USB defaults")
		return
	}

	bootFiles := []string{
		"/boot/usb.vid",
		"/boot/usb.pid",
		"/boot/usb.manufacturer",
		"/boot/usb.product",
		"/boot/usb.serial",
	}
	for _, f := range bootFiles {
		_ = os.Remove(f)
	}

	rsp.OkRsp(c)
	log.Debugf("restore USB defaults success")
}

func writeDescriptorFiles(vid, pid, manufacturer, product, serial string) error {
	writes := []struct {
		path  string
		value string
	}{
		{idVendorFile, vid},
		{idProductFile, pid},
		{manufacturerFile, manufacturer},
		{productFile, product},
		{configStringFile, product},
		{serialFile, serial},
	}

	for _, w := range writes {
		if err := writeConfigFS(w.path, w.value); err != nil {
			return fmt.Errorf("write %s: %w", w.path, err)
		}
	}

	return nil
}

func rebindUDC(fn func() error) error {
	// unbind UDC
	err := exec.Command("sh", "-c", "echo > "+udcFile).Run()
	if err != nil {
		return fmt.Errorf("unbind UDC: %w", err)
	}

	time.Sleep(100 * time.Millisecond)

	// apply changes
	if err := fn(); err != nil {
		return err
	}

	time.Sleep(100 * time.Millisecond)

	// rebind UDC
	err = exec.Command("sh", "-c", "ls /sys/class/udc/ | cat > "+udcFile).Run()
	if err != nil {
		return fmt.Errorf("rebind UDC: %w", err)
	}

	return nil
}

func persistBootFile(path string, value string) {
	if err := os.WriteFile(path, []byte(value), 0o644); err != nil {
		log.Errorf("failed to persist %s: %s", path, err)
	}
}

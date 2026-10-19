package vm

import (
	"os"
	"os/exec"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
)

// Boot-partition overrides read by /etc/init.d/S03usbdev when the USB
// gadget (configfs) is (re)armed. Removing a file restores that field's
// factory default. See kvmapp/system/init.d/S03usbdev.
const (
	usbVendorFile       = "/boot/usb.vid"
	usbProductIDFile    = "/boot/usb.pid"
	usbManufacturerFile = "/boot/usb.manufacturer"
	usbProductFile      = "/boot/usb.product"
	usbSerialFile       = "/boot/usb.serial"

	defaultUsbVendorID     = "0x3346"
	defaultUsbProductID    = "0x1009"
	defaultUsbManufacturer = "sipeed"
	defaultUsbProduct      = "NanoKVM"
	defaultUsbSerial       = "0123456789ABCDEF"
)

var (
	// idVendor / idProduct as accepted by configfs: "0x" + 4 hex digits.
	usbIDPattern = regexp.MustCompile(`^0x[0-9a-fA-F]{4}$`)

	// iManufacturer / iProduct / iSerialNumber USB string descriptors:
	// printable ASCII only, capped well under the descriptor length limit.
	usbStringPattern = regexp.MustCompile(`^[\x20-\x7E]{0,32}$`)

	restartUsbGadgetCommands = []string{
		"/etc/init.d/S03usbdev stop",
		"/etc/init.d/S03usbdev start",
	}
)

type usbIdentityField struct {
	path     string
	value    string
	pattern  *regexp.Regexp
	fallback string
}

func usbIdentityFields(req *proto.SetUsbIdentityReq) []usbIdentityField {
	return []usbIdentityField{
		{usbVendorFile, req.VendorID, usbIDPattern, defaultUsbVendorID},
		{usbProductIDFile, req.ProductID, usbIDPattern, defaultUsbProductID},
		{usbManufacturerFile, req.Manufacturer, usbStringPattern, defaultUsbManufacturer},
		{usbProductFile, req.Product, usbStringPattern, defaultUsbProduct},
		{usbSerialFile, req.Serial, usbStringPattern, defaultUsbSerial},
	}
}

func readUsbField(path, fallback string) (value string, isCustom bool) {
	data, err := os.ReadFile(path)
	if err != nil {
		return fallback, false
	}

	trimmed := strings.TrimSpace(string(data))
	if trimmed == "" {
		return fallback, false
	}

	return trimmed, true
}

// GetUsbIdentity returns the VID/PID and USB string descriptors the HID
// gadget currently identifies itself with, falling back to NanoKVM defaults
// for any field that has no /boot override.
func (s *Service) GetUsbIdentity(c *gin.Context) {
	var rsp proto.Response

	vendorID, vendorCustom := readUsbField(usbVendorFile, defaultUsbVendorID)
	productID, productCustom := readUsbField(usbProductIDFile, defaultUsbProductID)
	manufacturer, manufacturerCustom := readUsbField(usbManufacturerFile, defaultUsbManufacturer)
	product, productNameCustom := readUsbField(usbProductFile, defaultUsbProduct)
	serial, serialCustom := readUsbField(usbSerialFile, defaultUsbSerial)

	rsp.OkRspWithData(c, &proto.GetUsbIdentityRsp{
		VendorID:     vendorID,
		ProductID:    productID,
		Manufacturer: manufacturer,
		Product:      product,
		Serial:       serial,
		IsCustom:     vendorCustom || productCustom || manufacturerCustom || productNameCustom || serialCustom,
	})

	log.Debugf("get usb identity success")
}

// SetUsbIdentity updates the VID/PID and USB string descriptors the HID
// gadget presents to the host, then re-arms the USB gadget so the change
// takes effect on the next enumeration. An empty field resets that field
// to the NanoKVM default. HID input is paused for the brief re-enumeration
// window, same as toggling a virtual device (see UpdateVirtualDevice).
func (s *Service) SetUsbIdentity(c *gin.Context) {
	var req proto.SetUsbIdentityReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	fields := usbIdentityFields(&req)

	for _, f := range fields {
		if f.value == "" {
			continue
		}
		if !f.pattern.MatchString(f.value) {
			rsp.ErrRsp(c, -2, "invalid arguments")
			return
		}
	}

	for _, f := range fields {
		if f.value == "" {
			if err := os.Remove(f.path); err != nil && !os.IsNotExist(err) {
				rsp.ErrRsp(c, -3, "reset failed")
				return
			}
			continue
		}

		if err := os.WriteFile(f.path, []byte(f.value), 0o644); err != nil {
			rsp.ErrRsp(c, -4, "write failed")
			return
		}
	}

	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()

	var cmdErr error
	for _, command := range restartUsbGadgetCommands {
		if err := exec.Command("sh", "-c", command).Run(); err != nil {
			cmdErr = err
			break
		}
	}

	h.OpenNoLock()
	h.Unlock()

	if cmdErr != nil {
		rsp.ErrRsp(c, -5, "apply failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set usb identity: vid=%s pid=%s manufacturer=%q product=%q",
		req.VendorID, req.ProductID, req.Manufacturer, req.Product)
}

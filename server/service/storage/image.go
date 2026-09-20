package storage

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/hid"
)

const (
	imageDirectory = "/data"
	imageNone      = "/dev/mmcblk0p3"
	cdromFlag      = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/cdrom"
	mountDevice    = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/file"
	inquiryString  = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/inquiry_string"
	roFlag         = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/ro"
	usbProduct     = "/sys/kernel/config/usb_gadget/g0/strings/0x409/product"

	usbProductName = "NanoKVM"
	// the SCSI inquiry product field holds 16 bytes, the USB product string 126
	inquiryProductSize = 16
	usbProductSize     = 126
)

func (s *Service) GetImages(c *gin.Context) {
	var rsp proto.Response
	var images []string

	err := filepath.Walk(imageDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			name := strings.ToLower(info.Name())
			if strings.HasSuffix(name, ".iso") || strings.HasSuffix(name, ".img") {
				images = append(images, path)
			}
		}

		return nil
	})
	if err != nil {
		rsp.ErrRsp(c, -2, "get images failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetImagesRsp{
		Files: images,
	})
	log.Debugf("get images success, total %d", len(images))
}

func (s *Service) MountImage(c *gin.Context) {
	var req proto.MountImageReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	// The host owns the raw partition while the virtual disk serves it, so /data
	// has to be read-only here before the host can write it.
	if req.File == "" {
		if err := SetDataWritable(false); err != nil {
			log.Errorf("make %s read-only failed: %s", imageDirectory, err)
			rsp.ErrRsp(c, -2, "make /data read-only failed")
			return
		}
	}

	// set the LUN flags, unmounting first so no image is ever served writable
	if err := os.WriteFile(mountDevice, []byte("\n"), 0o666); err != nil {
		log.Errorf("unmount file failed: %s", err)
		rsp.ErrRsp(c, -2, "unmount image failed")
		return
	}

	// ro flag
	// set to 0 when unmount image
	// set to 1 when mount image, the host can only read the image
	roFlagValue := "0"
	if req.File != "" {
		roFlagValue = "1"
	}

	if err := os.WriteFile(roFlag, []byte(roFlagValue), 0o666); err != nil {
		log.Errorf("set ro flag failed: %s", err)
		rsp.ErrRsp(c, -2, "set ro flag failed")
		return
	}

	// cdrom flag
	// set to 0 when unmount image
	// set to 1 when mount image and the CD-ROM is enabled
	cdromFlagValue := "0"
	if req.File != "" && req.Cdrom {
		cdromFlagValue = "1"
	}

	if err := os.WriteFile(cdromFlag, []byte(cdromFlagValue), 0o666); err != nil {
		log.Errorf("set cdrom flag failed: %s", err)
		rsp.ErrRsp(c, -2, "set cdrom flag failed")
		return
	}

	inquiryVen := "NanoKVM"
	inquiryPrd := "USB Mass Storage"
	inquiryVer := 0x0520
	if req.Cdrom {
		inquiryPrd = "USB CD/DVD-ROM"
	}

	// the image name is what the host shows for the device and for the medium,
	// the SCSI inquiry is the medium and the USB product string the device itself
	productName := usbProductName
	if req.File != "" {
		if name := imageName(req.File); name != "" {
			inquiryPrd = cutName(name, inquiryProductSize)
			productName = cutName(name, usbProductSize)
		}
	}

	inquiryData := fmt.Sprintf("%-8s%-16s%04x", inquiryVen, inquiryPrd, inquiryVer)

	if err := os.WriteFile(inquiryString, []byte(inquiryData), 0o666); err != nil {
		log.Errorf("set inquiry %s failed: %s", inquiryData, err)
		rsp.ErrRsp(c, -2, "set inquiry failed")
		return
	}

	if err := os.WriteFile(usbProduct, []byte(productName), 0o666); err != nil {
		log.Errorf("set usb product %s failed: %s", productName, err)
	}

	// mount
	image := req.File
	if image == "" {
		image = imageNone
	}

	if err := os.WriteFile(mountDevice, []byte(image), 0o666); err != nil {
		log.Errorf("mount file %s failed: %s", image, err)
		rsp.ErrRsp(c, -2, "mount image failed")
		return
	}

	// An image is served read-only, so the KVM writes /data itself again. The
	// host can not write the image either way.
	if req.File != "" {
		if err := SetDataWritable(true); err != nil {
			log.Warnf("make %s writable failed: %s", imageDirectory, err)
		}
	}

	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		h.OpenNoLock()
		h.Unlock()
	}()

	// reset usb
	commands := []string{
		"echo > /sys/kernel/config/usb_gadget/g0/UDC",
		"ls /sys/class/udc/ | cat > /sys/kernel/config/usb_gadget/g0/UDC",
	}

	for _, command := range commands {
		err := exec.Command("sh", "-c", command).Run()
		if err != nil {
			rsp.ErrRsp(c, -2, "execute command failed")
			return
		}
		time.Sleep(100 * time.Millisecond)
	}

	rsp.OkRsp(c)
	log.Debugf("mount image %s success", req.File)
}

func (s *Service) GetMountedImage(c *gin.Context) {
	var rsp proto.Response

	mode, err := hid.GetMode()
	if err != nil {
		rsp.ErrRsp(c, -2, "get HID mode failed")
		return
	}

	if mode == hid.ModeHidOnly {
		rsp.OkRspWithData(c, &proto.GetMountedImageRsp{
			File: "",
		})
		return
	}

	image, err := MountedImage()
	if err != nil {
		rsp.ErrRsp(c, -2, "read failed")
		return
	}

	data := &proto.GetMountedImageRsp{
		File: image,
	}

	rsp.OkRspWithData(c, data)
}

// MountedImage returns the mounted image file, empty if no image is mounted
func MountedImage() (string, error) {
	content, err := os.ReadFile(mountDevice)
	if err != nil {
		return "", err
	}

	image := strings.ReplaceAll(string(content), "\n", "")
	if image == imageNone {
		image = ""
	}

	return image, nil
}

// imageName returns the file name of an image without the extension
func imageName(file string) string {
	return strings.TrimSuffix(filepath.Base(file), filepath.Ext(file))
}

// cutName cuts a name to size bytes without splitting a character
func cutName(name string, size int) string {
	if len(name) <= size {
		return name
	}

	name = name[:size]
	for !utf8.ValidString(name) {
		name = name[:len(name)-1]
	}

	return name
}

// SetDataWritable remounts /data read-write or read-only. Only one side may
// write the partition at a time: while the virtual disk shares it with the host
// as a writable disk, /data is read-only here, and it becomes writable again
// once the share is released or an image is served read-only instead.
func SetDataWritable(writable bool) error {
	var stat unix.Statfs_t
	if err := unix.Statfs(imageDirectory, &stat); err != nil {
		return err
	}

	if (stat.Flags&unix.ST_RDONLY == 0) == writable {
		return nil
	}

	option := "rw"
	if !writable {
		option = "ro"
	}

	if err := exec.Command("mount", "-o", "remount,"+option, imageDirectory).Run(); err != nil {
		return err
	}

	// never hand a writable /data to the host
	var check unix.Statfs_t
	if err := unix.Statfs(imageDirectory, &check); err != nil {
		return err
	}
	if (check.Flags&unix.ST_RDONLY == 0) != writable {
		return errors.New(imageDirectory + " mount did not change")
	}

	return nil
}

// DataDiskAttached reports whether the mass storage device serves the whole /data partition to the host
func DataDiskAttached() bool {
	content, err := os.ReadFile(mountDevice)
	if err != nil {
		return false
	}

	return strings.ReplaceAll(string(content), "\n", "") == imageNone
}

func (s *Service) GetCdRom(c *gin.Context) {
	var rsp proto.Response

	content, err := os.ReadFile(cdromFlag)
	if err != nil {
		rsp.ErrRsp(c, -1, "read failed")
		return
	}

	flag := strings.ReplaceAll(string(content), "\n", "")
	flatInt, err := strconv.ParseInt(flag, 10, 64)
	if err != nil {
		rsp.ErrRsp(c, -2, "parse failed")
		return
	}

	data := &proto.GetCdRomRsp{
		Cdrom: flatInt,
	}

	rsp.OkRspWithData(c, data)
}

func (s *Service) DeleteImage(c *gin.Context) {
	var req proto.DeleteImageReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	filename := strings.ToLower(req.File)
	validPrefix := strings.HasPrefix(filename, imageDirectory)
	validSuffix := strings.HasSuffix(filename, ".iso") || strings.HasSuffix(filename, ".img")

	if !validPrefix || !validSuffix {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if err := os.Remove(req.File); err != nil {
		rsp.ErrRsp(c, -3, "remove file failed")
		log.Errorf("failed to remove file %s: %s", req.File, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete image %s success", req.File)
}

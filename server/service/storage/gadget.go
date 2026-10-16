package storage

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unicode/utf8"

	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/utils"
)

// The emulated USB disk is one LUN of the configfs mass storage function.
// Everything here is sysfs poking, and the kernel owns the rules:
//
//   - writing an empty value to lun.0/file detaches the medium (the target
//     machine sees a media removal), writing a path attaches one;
//   - the read-only flag can only change while no medium is attached, so a
//     mount always goes eject -> flags -> inquiry -> file;
//   - a host that locked the medium (prevent_medium_removal, which Windows
//     sets while the disk is mounted) makes both fail with EBUSY.
const (
	gadgetRoot      = "/sys/kernel/config/usb_gadget/g0"
	gadgetUDC       = gadgetRoot + "/UDC"
	gadgetUDCDir    = "/sys/class/udc"
	massStorageFunc = gadgetRoot + "/functions/mass_storage.disk0"
	massStorageLink = gadgetRoot + "/configs/c.1/mass_storage.disk0"
	lunCDRomFlag    = massStorageFunc + "/lun.0/cdrom"
	lunMountDevice  = massStorageFunc + "/lun.0/file"
	lunInquiry      = massStorageFunc + "/lun.0/inquiry_string"
	lunROFlag       = massStorageFunc + "/lun.0/ro"
	// usbProductAttr is the device name the target machine shows. An image is
	// named after its file, the shared partition keeps the product name.
	usbProductAttr = gadgetRoot + "/strings/0x409/product"
)

const (
	usbProductName = "NanoKVM"
	// The SCSI inquiry product field holds 16 bytes, the USB product string 126.
	inquiryProductSize = 16
	usbProductSize     = 126
)

// ErrMediumLocked reports that the target machine is still using the medium.
// It is a normal condition, not a failure: the user has to eject the disk
// there before the web UI can take it back.
var ErrMediumLocked = errors.New("the target machine is using the medium")

type diskState string

const (
	diskStateNone        diskState = "none"        // no medium attached
	diskStateImage       diskState = "image"       // an image file is attached
	diskStatePartition   diskState = "partition"   // the whole data partition is attached
	diskStateUnsupported diskState = "unsupported" // no mass storage function (virtual disk off, or HID-only)
)

// diskStatus is what the gadget exposes to the target machine right now. The
// backing file is the single source of truth: both the UI and the file manager
// read it instead of keeping their own idea of what is mounted.
type diskStatus struct {
	State   diskState
	Backing string
	HidOnly bool
}

// lunConfig is the LUN configuration a mount request results in.
type lunConfig struct {
	backing string
	ro      bool
	cdrom   bool
}

func readDiskStatus() (diskStatus, error) {
	mode, err := hid.GetMode()
	hidOnly := err == nil && mode == hid.ModeHidOnly

	// Switching the virtual disk off removes the link that exposes the
	// function to the target machine, while the function itself stays behind
	// with whatever medium was attached to it. The link is therefore what says
	// whether a medium would actually be visible, and without it a mount would
	// look like it worked and change nothing.
	if !pathExists(massStorageFunc) || !pathExists(massStorageLink) {
		return diskStatus{State: diskStateUnsupported, HidOnly: hidOnly}, nil
	}

	config, err := readLunConfig()
	if err != nil {
		return diskStatus{}, err
	}

	status := diskStatus{HidOnly: hidOnly}
	switch {
	case config.backing == "":
		status.State = diskStateNone
	case config.backing == partitionDevice:
		status.State = diskStatePartition
		status.Backing = config.backing
	default:
		status.State = diskStateImage
		status.Backing = config.backing
		// A running gadget may still report an alias used before this process
		// started. Normalize it too, so every operation compares the same
		// exFAT directory entry rather than just the same string.
		if canonical, err := utils.CanonicalMediaPath(config.backing); err == nil {
			status.Backing = canonical
		}
	}

	return status, nil
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readLunConfig() (lunConfig, error) {
	backing, err := readLunAttr(lunMountDevice)
	if err != nil {
		return lunConfig{}, err
	}

	ro, err := readLunBool(lunROFlag)
	if err != nil {
		return lunConfig{}, err
	}

	cdrom, err := readLunBool(lunCDRomFlag)
	if err != nil {
		return lunConfig{}, err
	}

	return lunConfig{backing: backing, ro: ro, cdrom: cdrom}, nil
}

func readLunAttr(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read %s: %w", path, err)
	}
	return strings.TrimSpace(string(data)), nil
}

func readLunBool(path string) (bool, error) {
	value, err := readLunAttr(path)
	if err != nil {
		return false, err
	}
	return value == "1", nil
}

// eject detaches the medium, which the target machine sees as a media removal.
func eject() error {
	// The medium goes first. While it is attached the kernel refuses ro but
	// takes cdrom=0 and a new name, so resetting those first would relabel a
	// medium the target machine still holds whenever the detach itself then
	// fails with EBUSY. A zero length write never reaches the kernel, so an
	// empty line is what actually detaches the medium.
	if err := writeLunAttr(lunMountDevice, "\n"); err != nil {
		if errors.Is(err, syscall.EBUSY) {
			return ErrMediumLocked
		}
		return fmt.Errorf("eject medium: %w", err)
	}

	// The flags outlive the medium: the kernel only lets ro change while
	// nothing is attached, and a stale CD-ROM flag would describe the next
	// medium wrongly (a restart of the boot script resets them for the same
	// reason). The device also keeps the name it was built with while nothing
	// is attached.
	if err := writeLunAttr(lunInquiry, inquiryData("USB Mass Storage")); err != nil {
		log.Warnf("restore inquiry string failed: %s", err)
	}
	if err := writeLunAttr(usbProductAttr, usbProductName); err != nil {
		log.Warnf("restore usb product failed: %s", err)
	}
	if err := writeLunAttr(lunROFlag, boolAttr(false)); err != nil {
		log.Warnf("reset read-only flag failed: %s", err)
	}
	if err := writeLunAttr(lunCDRomFlag, boolAttr(false)); err != nil {
		log.Warnf("reset cdrom flag failed: %s", err)
	}

	return nil
}

// attach runs the sequence the kernel requires. The read-only flag can only be
// written while no medium is attached, and both it and the CD-ROM flag force a
// detach of their own, so the order is fixed and every flag is written on
// every mount: leaving a stale cdrom=1 behind is how an image file ends up
// presented to the target as a CD-ROM.
func attach(backing string, cdrom, ro bool) error {
	if backing == "" {
		return errors.New("empty backing file")
	}
	if cdrom {
		// CD-ROM media is always read only.
		ro = true
	}

	// The target machine is the only writer of the data partition while the
	// emulated disk serves it, so /data goes read-only here before it can write
	// it. An image is served read-only instead, which leaves /data to this
	// side, so that handover happens after the gadget carries the image.
	if backing == partitionDevice {
		if err := SetDataWritable(false); err != nil {
			return fmt.Errorf("make %s read-only: %w", mediaDirectory, err)
		}
	}

	if err := eject(); err != nil {
		return err
	}
	if err := writeLunAttr(lunROFlag, boolAttr(ro)); err != nil {
		return fmt.Errorf("set read-only flag: %w", err)
	}
	if err := writeLunAttr(lunCDRomFlag, boolAttr(cdrom)); err != nil {
		return fmt.Errorf("set cdrom flag: %w", err)
	}
	if err := writeLunAttr(lunInquiry, inquiryData(mediumProduct(backing, cdrom))); err != nil {
		return fmt.Errorf("set inquiry string: %w", err)
	}
	if err := writeLunAttr(usbProductAttr, mediumDeviceName(backing)); err != nil {
		// The target machine is left with the previous device name instead of
		// failing the mount: the medium itself is what matters.
		log.Warnf("set usb product failed: %s", err)
	}
	if err := writeLunAttr(lunMountDevice, backing); err != nil {
		if errors.Is(err, syscall.EBUSY) {
			return ErrMediumLocked
		}
		return fmt.Errorf("attach %s: %w", backing, err)
	}

	if err := rebindUDC(); err != nil {
		return err
	}

	if backing != partitionDevice {
		if err := SetDataWritable(true); err != nil {
			log.Warnf("make %s writable failed: %s", mediaDirectory, err)
		}
	}

	return nil
}

// mediumProduct is the SCSI product string of the medium: an image is shown
// under its file name, the mount mode names the medium otherwise.
func mediumProduct(backing string, cdrom bool) string {
	if name := imageMediumName(backing); name != "" {
		return cutName(name, inquiryProductSize)
	}
	if cdrom {
		return "USB CD/DVD-ROM"
	}

	return "USB Mass Storage"
}

// mediumDeviceName is the USB product string, which the target machine shows
// as the device name. The shared partition keeps the one it was built with.
func mediumDeviceName(backing string) string {
	if name := imageMediumName(backing); name != "" {
		return cutName(name, usbProductSize)
	}

	return usbProductName
}

// imageMediumName is the name a mounted image is shown under: its file name
// without the extension. The raw partition is not an image.
func imageMediumName(backing string) string {
	if backing == partitionDevice {
		return ""
	}

	return imageName(backing)
}

// imageName strips the extension from the file name of a medium.
func imageName(path string) string {
	name := filepath.Base(path)
	if extension := filepath.Ext(name); extension != "" {
		name = strings.TrimSuffix(name, extension)
	}

	return name
}

// cutName cuts name to size bytes without leaving a broken UTF-8 rune behind:
// the inquiry field and the USB product string are both byte limited.
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

func writeLunAttr(path, value string) error {
	if err := os.WriteFile(path, []byte(value), 0o666); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}
	return nil
}

func boolAttr(value bool) string {
	if value {
		return "1"
	}
	return "0"
}

func inquiryData(product string) string {
	return fmt.Sprintf("%-8s%-16s%04x", "NanoKVM", product, 0x0520)
}

// unbindUDC tears the gadget down. The kernel clears the medium lock the
// target machine set (prevent_medium_removal) whenever the function is
// reconfigured, so this is what makes a forced eject possible: without it the
// kernel refuses to touch the medium while the target machine is holding it.
func unbindUDC() error {
	if err := writeLunAttr(gadgetUDC, "\n"); err != nil {
		return fmt.Errorf("unbind UDC: %w", err)
	}

	return nil
}

// rebindUDC re-enumerates the gadget. It drops and re-adds every function,
// keyboard and mouse included, which is why callers skip it when nothing
// changed.
func rebindUDC() error {
	// The forced path unbinds the gadget first, so it can already be unbound
	// here; the kernel answers that with ENODEV instead of doing anything.
	if err := writeLunAttr(gadgetUDC, "\n"); err != nil && !errors.Is(err, syscall.ENODEV) {
		return fmt.Errorf("unbind UDC: %w", err)
	}

	udc, err := firstUDC()
	if err != nil {
		return err
	}

	time.Sleep(100 * time.Millisecond)
	if err := writeLunAttr(gadgetUDC, udc+"\n"); err != nil {
		return fmt.Errorf("bind UDC %s: %w", udc, err)
	}

	return nil
}

func firstUDC() (string, error) {
	entries, err := os.ReadDir(gadgetUDCDir)
	if err != nil {
		return "", fmt.Errorf("list UDC: %w", err)
	}
	for _, entry := range entries {
		return entry.Name(), nil
	}
	return "", errors.New("no UDC available")
}

// withHIDLock closes the HID devices around a gadget operation, because
// re-enumerating drops them. The reopen is retried and never turns a
// successful operation into a failure: builds without HID (/boot/disable_hid)
// have nothing to open at all.
func withHIDLock(fn func() error) error {
	h := hid.GetHid()
	h.Lock()
	h.CloseNoLock()
	defer func() {
		hid.ReopenAfterRebind()
		h.Unlock()
	}()

	return fn()
}

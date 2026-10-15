// Package diskfs gives the file manager access to the filesystem inside a
// medium. A medium is a disk image stored on the data partition, so the only
// way in and out is a loop mount: the device kernel has exFAT and FAT built
// in, and ships mkfs.exfat plus busybox mkdosfs, so both creating and mounting
// image files stays in the kernel instead of a hand written FAT reader.
//
// The medium must not be attached to the target machine while it is mounted
// here. Callers enforce that (see service/storage); this package only tracks
// its own mounts so concurrent requests share one.
package diskfs

import (
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"NanoKVM-Server/utils"
)

// Kind is the filesystem a medium holds.
type Kind string

const (
	KindExFAT   Kind = "exfat"
	KindFAT32   Kind = "fat32"
	KindFAT16   Kind = "fat16"
	KindFAT12   Kind = "fat12"
	KindISO9660 Kind = "iso9660"
	KindUnknown Kind = "unknown"
)

// Browsable reports whether the file manager can list files inside the medium.
// ISO 9660 is readable but read-only and not part of v1.
func (k Kind) Browsable() bool {
	switch k {
	case KindExFAT, KindFAT32, KindFAT16, KindFAT12:
		return true
	default:
		return false
	}
}

// FileSystem is the type name the kernel mount needs. vfat covers every FAT
// variant (msdos is the subset without long names).
func (k Kind) FileSystem() string {
	switch k {
	case KindExFAT:
		return "exfat"
	case KindFAT32, KindFAT16, KindFAT12:
		return "vfat"
	case KindISO9660:
		return "iso9660"
	default:
		return ""
	}
}

// Entry is one directory entry inside a medium.
type Entry struct {
	Name    string    `json:"name"`
	Size    int64     `json:"size"`
	IsDir   bool      `json:"isDir"`
	ModTime time.Time `json:"modifiedAt"`
}

// Caps is what the device can actually do. Mounting a medium needs a loop
// device; the file manager reports a missing capability instead of failing
// with a bare exec error, because a custom build may not have one.
type Caps struct {
	Loop bool `json:"loop"`
}

// ErrUnsupported reports a missing device capability.
var ErrUnsupported = errors.New("unsupported on this device")

// Probe reports the device's media capabilities. The answer cannot change
// while the server runs, and the listing asks for it on every poll, so it is
// computed once.
func Probe() Caps {
	probeOnce.Do(func() {
		probedCaps = Caps{
			Loop: lookPath("losetup") && pathExists("/dev/loop-control"),
		}
	})

	return probedCaps
}

var (
	probeOnce  sync.Once
	probedCaps Caps
)

// Err describes what is missing, or nil when the device can browse media.
func (c Caps) Err() error {
	if !c.Loop {
		return fmt.Errorf("%w: no loop device support", ErrUnsupported)
	}
	return nil
}

// Detect reads the boot sector and reports the filesystem, so the UI knows
// whether a medium can be browsed before anything is mounted.
func Detect(imagePath string) (Kind, error) {
	file, err := os.Open(imagePath)
	if err != nil {
		return KindUnknown, err
	}
	defer func() {
		_ = file.Close()
	}()

	boot := make([]byte, 512)
	if _, err := io.ReadFull(file, boot); err != nil {
		return KindUnknown, nil // too small to hold a filesystem
	}

	if string(boot[3:11]) == "EXFAT   " {
		return KindExFAT, nil
	}

	if boot[510] == 0x55 && boot[511] == 0xaa {
		// A FAT32 volume also carries the legacy "FAT16" string at 0x36, so
		// the FAT32 field has to be looked at first.
		if fat := boot[0x52 : 0x52+8]; isFATLabel(fat) {
			return fatKind(string(fat)), nil
		}
		if fat := boot[0x36 : 0x36+8]; isFATLabel(fat) {
			return fatKind(string(fat)), nil
		}
	}

	// ISO 9660 keeps its identifier 32 KiB into the image.
	if _, err := file.Seek(0x8001, io.SeekStart); err == nil {
		magic := make([]byte, 5)
		if _, err := io.ReadFull(file, magic); err == nil && string(magic) == "CD001" {
			return KindISO9660, nil
		}
	}

	return KindUnknown, nil
}

func isFATLabel(label []byte) bool {
	return len(label) == 8 && (string(label[:5]) == "FAT12" || string(label[:5]) == "FAT16" || string(label[:5]) == "FAT32")
}

func fatKind(label string) Kind {
	switch label[:5] {
	case "FAT12":
		return KindFAT12
	case "FAT16":
		return KindFAT16
	default:
		return KindFAT32
	}
}

func lookPath(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func trimOutput(out []byte) string {
	const limit = 200
	text := string(out)
	if len(text) > limit {
		text = text[:limit]
	}
	return text
}

// ResolveInside resolves rel inside root and refuses anything that escapes it.
// Callers validate paths before this, so a failure here means a bug.
func ResolveInside(root, rel string) (string, error) {
	if rel == "" || rel == "/" {
		return root, nil
	}

	full := filepath.Join(root, filepath.FromSlash(rel))
	inside, err := filepath.Rel(root, full)
	if err != nil || inside == ".." || strings.HasPrefix(inside, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("%w: %s escapes the medium", utils.ErrInvalidMediaPath, rel)
	}

	return full, nil
}

func shellQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", `'\''`) + "'"
}

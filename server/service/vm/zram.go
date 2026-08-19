package vm

import (
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var (
	// errZramUnavailable means the kernel modules are missing. They are built
	// out of tree by tools/zram/build-modules.sh and are not part of the
	// install package, so a device can be perfectly healthy without them.
	errZramUnavailable = errors.New("zram modules are not installed")

	// errZramStartFailed means the init script ran but produced no device.
	errZramStartFailed = errors.New("zram did not start")
)

// zramDevice is the swap device the init script creates. There is only ever
// one: the script does not configure zram1 and up.
const zramDevice = "/dev/zram0"

// zramModules are the two modules the device needs. zsmalloc is separate
// because CONFIG_ZSMALLOC is unset in the stock kernel, so zram cannot pull it
// from the image. tools/zram/build-modules.sh builds both.
var zramModules = []string{"zram.ko", "zsmalloc.ko"}

// zramModuleDirs are searched in order for the pair of modules.
//
// /mnt/system/ko is the base image's module directory and is where
// tools/zram/build-modules.sh installs the pair today. It is searched second,
// because /mnt is not a mount point: it is a plain directory on the root
// filesystem, so a rootfs update or a re-flash removes anything put there and
// the feature reverts to unavailable without reporting a fault.
//
// /kvmapp/system/ko is part of the install package, which an update restores.
// The modules are not shipped there today, so on a stock device it holds no
// pair and the search falls through. It is first so that shipping them later
// needs no further change.
//
// S01zram searches the same two directories in the same order.
var zramModuleDirs = []string{"/kvmapp/system/ko", "/mnt/system/ko"}

// These are variables rather than constants so a test can point the reader at
// a temporary tree.
var (
	zramInitScript = "/etc/init.d/S01zram"
	zramInitSource = "/kvmapp/system/init.d/S01zram"
	zramSysfsDir   = "/sys/block/zram0"
	procSwapsPath  = "/proc/swaps"
	procVmstatPath = "/proc/vmstat"
)

// zramStatus separates three questions that a single on/off flag would merge.
// Available and Enabled can each be true while the device does not run, and
// those are the states an operator needs to tell apart.
type zramStatus struct {
	Available bool // both kernel modules are installed
	Enabled   bool // the init script is installed, so the setting survives a reboot
	Active    bool // compressed swap runs now

	Algorithm  string
	DiskSize   int64
	Original   int64
	Compressed int64
	MemUsed    int64
	MemLimit   int64
	SwapIn     int64
	SwapOut    int64
}

// readZramStatus reports the current state. It never fails: a board without
// zram is a normal board, so every unreadable source contributes a zero or a
// false rather than an error.
func readZramStatus() zramStatus {
	status := zramStatus{
		Available: zramModulesInstalled(),
		Enabled:   fileExists(zramInitScript),
		Active:    parseSwapsHasZram(readFileString(procSwapsPath)),
	}

	status.Algorithm = parseCompAlgorithm(readSysfsAttr("comp_algorithm"))
	status.DiskSize = parseInt64(readSysfsAttr("disksize"))

	stat := parseMmStat(readSysfsAttr("mm_stat"))
	status.Original = stat.Original
	status.Compressed = stat.Compressed
	status.MemUsed = stat.MemUsed
	status.MemLimit = stat.MemLimit

	status.SwapIn, status.SwapOut = parseVmstatSwap(readFileString(procVmstatPath))

	return status
}

// GetZram reports the state of compressed swap. It always succeeds: a board
// without the kernel modules is a normal board, and a diagnostic that fails
// the request would tell the operator less than one that reports "unavailable".
func (s *Service) GetZram(c *gin.Context) {
	var rsp proto.Response

	status := readZramStatus()

	rsp.OkRspWithData(c, &proto.GetZramRsp{
		Available:  status.Available,
		Enabled:    status.Enabled,
		Active:     status.Active,
		Algorithm:  status.Algorithm,
		DiskSize:   status.DiskSize,
		Original:   status.Original,
		Compressed: status.Compressed,
		MemUsed:    status.MemUsed,
		MemLimit:   status.MemLimit,
		SwapIn:     status.SwapIn,
		SwapOut:    status.SwapOut,
	})
}

// SetZram turns compressed swap on or off, and makes the choice survive a
// reboot.
func (s *Service) SetZram(c *gin.Context) {
	var rsp proto.Response
	var req proto.SetZramReq

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if req.Enabled {
		switch err := enableZram(); {
		case errors.Is(err, errZramUnavailable):
			rsp.ErrRsp(c, -2, "zram modules are not installed")
			return
		case err != nil:
			rsp.ErrRsp(c, -3, "enable zram failed")
			return
		}
	} else if err := disableZram(); err != nil {
		rsp.ErrRsp(c, -4, "disable zram failed")
		return
	}

	rsp.OkRsp(c)
}

// enableZram installs the init script and starts compressed swap.
//
// The script is what makes the setting survive a reboot, so it is removed
// again if the device does not come up. An installed script beside a dead
// device would report "survives a reboot" for a feature that does not run.
func enableZram() error {
	if !zramModulesInstalled() {
		log.Errorf("zram modules are not installed in any of %s", strings.Join(zramModuleDirs, ", "))
		return errZramUnavailable
	}

	if err := installZramInitScript(); err != nil {
		return err
	}

	command := zramInitScript + " start"
	if err := runShellCommand(command); err != nil {
		log.Errorf("failed to execute %s: %s", command, err)
		_ = os.Remove(zramInitScript)
		return err
	}

	if !parseSwapsHasZram(readFileString(procSwapsPath)) {
		log.Errorf("%s reported success but %s is not in %s",
			command, zramDevice, procSwapsPath)
		_ = os.Remove(zramInitScript)
		return errZramStartFailed
	}

	return nil
}

// disableZram stops compressed swap and removes the init script. It succeeds
// on a device where zram was never enabled.
func disableZram() error {
	switch {
	case fileExists(zramInitScript):
		command := zramInitScript + " stop"
		if err := runShellCommand(command); err != nil {
			log.Errorf("failed to execute %s: %s", command, err)
			return err
		}

	case parseSwapsHasZram(readFileString(procSwapsPath)):
		// The script was never installed, but someone started zram by hand.
		// There is nothing to remove and the device must still stop.
		command := "swapoff " + zramDevice
		if err := runShellCommand(command); err != nil {
			log.Errorf("failed to execute %s: %s", command, err)
			return err
		}
	}

	if err := os.Remove(zramInitScript); err != nil && !os.IsNotExist(err) {
		log.Errorf("failed to delete %s: %s", zramInitScript, err)
		return err
	}

	return nil
}

// installZramInitScript copies the packaged script into /etc/init.d.
//
// The list of scripts that kvm_system copies at boot is hard-coded C++, so
// adding one there would need a MaixCDK rebuild and a redeploy on every
// device. The server installs this one instead, the way S98tailscaled already
// treats presence in /etc/init.d as the installed marker.
func installZramInitScript() error {
	content, err := os.ReadFile(zramInitSource)
	if err != nil {
		log.Errorf("failed to read %s: %s", zramInitSource, err)
		return err
	}

	// The mode matters: a script that is not executable never runs at boot,
	// and the failure only appears after a reboot.
	if err := os.WriteFile(zramInitScript, content, 0o755); err != nil {
		log.Errorf("failed to write %s: %s", zramInitScript, err)
		return err
	}

	// WriteFile does not change the mode of a file that already exists.
	if err := os.Chmod(zramInitScript, 0o755); err != nil {
		log.Errorf("failed to chmod %s: %s", zramInitScript, err)
		return err
	}

	return nil
}

// zramModuleDir returns the first directory that holds every module, or an
// empty string when no directory holds a complete set.
//
// A directory has to hold both. One of the two on its own cannot load, and a
// pair split across two directories would be two separate builds: they carry
// the same vermagic, so the kernel accepts them, and zram then resolves its
// symbols against a zsmalloc it was not compiled with.
func zramModuleDir() string {
	for _, dir := range zramModuleDirs {
		complete := true

		for _, module := range zramModules {
			if !fileExists(filepath.Join(dir, module)) {
				complete = false
				break
			}
		}

		if complete {
			return dir
		}
	}

	return ""
}

// zramModulesInstalled reports whether a complete pair of modules is present.
func zramModulesInstalled() bool {
	return zramModuleDir() != ""
}

func readSysfsAttr(name string) string {
	return readFileString(filepath.Join(zramSysfsDir, name))
}

// readFileString returns the contents of a file, or an empty string when it
// cannot be read. Absence is the expected case here, not a fault worth logging.
func readFileString(path string) string {
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}

	return string(content)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func parseInt64(content string) int64 {
	value, err := strconv.ParseInt(strings.TrimSpace(content), 10, 64)
	if err != nil {
		return 0
	}

	return value
}

// zramMmStat holds the four fields of /sys/block/zram0/mm_stat that this
// service reports. mem_limit is write-only in sysfs, so field 4 here is the
// only way to read back what the init script set.
type zramMmStat struct {
	Original   int64 // orig_data_size: bytes before compression
	Compressed int64 // compr_data_size: bytes after compression
	MemUsed    int64 // mem_used_total: RAM zram holds, including its own overhead
	MemLimit   int64 // mem_limit: the cap on MemUsed, 0 when unset
}

// parseMmStat reads the leading fields of an mm_stat line. A device that is
// absent, empty or truncated is a normal state on a board where zram is
// optional, so every unreadable field stays zero instead of raising an error.
func parseMmStat(content string) zramMmStat {
	var stat zramMmStat
	targets := []*int64{&stat.Original, &stat.Compressed, &stat.MemUsed, &stat.MemLimit}

	for i, field := range strings.Fields(content) {
		if i >= len(targets) {
			break
		}

		value, err := strconv.ParseInt(field, 10, 64)
		if err != nil {
			// The fields before this one are still trustworthy; the ones
			// after cannot be trusted to be in the position we expect.
			break
		}

		*targets[i] = value
	}

	return stat
}

// parseCompAlgorithm returns the selected entry of a comp_algorithm list, which
// sysfs marks with square brackets: "lzo [lzo-rle] zstd". The list has no
// selection until disksize is set, and an empty result reports that honestly.
func parseCompAlgorithm(content string) string {
	open := strings.Index(content, "[")
	if open < 0 {
		return ""
	}

	closing := strings.Index(content[open:], "]")
	if closing < 0 {
		return ""
	}

	return content[open+1 : open+closing]
}

// parseVmstatSwap reads the pswpin and pswpout counters from /proc/vmstat.
// Both are system-wide and cover every swap device, not zram alone.
func parseVmstatSwap(content string) (in int64, out int64) {
	for _, line := range strings.Split(content, "\n") {
		fields := strings.Fields(line)
		if len(fields) != 2 {
			continue
		}

		value, err := strconv.ParseInt(fields[1], 10, 64)
		if err != nil {
			continue
		}

		switch fields[0] {
		case "pswpin":
			in = value
		case "pswpout":
			out = value
		}
	}

	return in, out
}

// parseSwapsHasZram reports whether /proc/swaps lists the zram device. This is
// the runtime truth: it is true only while compressed swap actually runs.
func parseSwapsHasZram(content string) bool {
	return parseSwapsHas(content, zramDevice)
}

// parseSwapsHas reports whether /proc/swaps lists one device. It compares the
// whole first field, because a substring test would match /dev/zram01 against
// /dev/zram0.
func parseSwapsHas(content string, device string) bool {
	for _, line := range strings.Split(content, "\n") {
		fields := strings.Fields(line)
		if len(fields) > 0 && fields[0] == device {
			return true
		}
	}

	return false
}

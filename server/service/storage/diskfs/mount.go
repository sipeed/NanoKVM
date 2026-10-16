package diskfs

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"

	"NanoKVM-Server/utils"
)

// MountRoot holds the loop mounts while a medium is browsed. It lives under
// /run next to the transfer lock: a reboot clears it, and it is not inside
// /data where the medium listing walks every file.
const MountRoot = "/run/nanokvm/media"

// loopDeviceLimit is the number of loop devices the kernel is configured with;
// scanning them all is cheaper than parsing losetup output.
const loopDeviceLimit = 8

// UploadPrefix marks a partially written upload inside a medium. It is deleted
// on failure, renamed into place on success, and never handed out as a file.
const UploadPrefix = ".kvm-upload-"

// Image is a mounted medium. Handles are reference counted, because a download
// may stream for minutes while the file list is refreshed, and both have to
// see the same mount.
type Image interface {
	List(rel string) ([]Entry, error)
	Open(rel string) (io.ReadSeekCloser, Entry, error)
	Write(rel string, r io.Reader) (int64, error)
	Remove(rel string) error
	StatFS() (total, available uint64, err error)
	Close() error
}

type mount struct {
	path       string
	mountpoint string
	loopDevice string
	writable   bool
	refs       int
}

var (
	mountsMu sync.Mutex
	mounts   = map[string]*mount{}
	// readers counts direct readers of a medium's file: an image download
	// streams the file itself rather than a mount. A writable mount would
	// tear the stream those readers see, so it is refused while any of them
	// is active. Guarded by mountsMu, so the check and the mount stay one step.
	readers = map[string]int{}
)

// Mount opens the filesystem inside a medium and returns a handle to it. The
// caller is responsible for making sure the medium is not attached to the
// target machine at the same time: two writers on one filesystem is how an
// image gets destroyed.
func Mount(imagePath string, writable bool) (Image, error) {
	if err := Probe().Err(); err != nil {
		return nil, err
	}

	kind, err := Detect(imagePath)
	if err != nil {
		return nil, err
	}
	if !kind.Browsable() {
		return nil, fmt.Errorf("%w: %s holds no filesystem the file manager can browse", ErrUnsupported, imagePath)
	}

	mountsMu.Lock()
	defer mountsMu.Unlock()

	if existing, ok := mounts[imagePath]; ok {
		// Sharing a read-write mount for reading is fine; the other way round
		// is not, because the mount was set up read only.
		if writable && !existing.writable {
			return nil, fmt.Errorf("medium is already open for reading")
		}
		existing.refs++
		return &handle{mount: existing}, nil
	}

	// A direct reader holds no mount, so it does not show up above; a write
	// would tear the stream it is reading.
	if writable && readers[imagePath] > 0 {
		return nil, fmt.Errorf("%w: %s is being read", ErrBusy, imagePath)
	}

	attached, err := attach(imagePath, kind, writable)
	if err != nil {
		return nil, err
	}
	attached.refs = 1
	mounts[imagePath] = attached

	return &handle{mount: attached}, nil
}

// AcquireReadPin marks a medium's file as being read directly, outside a
// mount, and refuses while the file manager holds the medium open for
// writing: the stream would otherwise serve a file that changes underneath
// it. The returned function releases the pin and is safe to call twice.
func AcquireReadPin(imagePath string) (func(), error) {
	mountsMu.Lock()
	defer mountsMu.Unlock()

	if existing, ok := mounts[imagePath]; ok && existing.writable {
		return nil, fmt.Errorf("%w: %s is open for writing", ErrBusy, imagePath)
	}

	readers[imagePath]++

	var once sync.Once
	return func() {
		once.Do(func() {
			mountsMu.Lock()
			defer mountsMu.Unlock()

			readers[imagePath]--
			if readers[imagePath] <= 0 {
				delete(readers, imagePath)
			}
		})
	}, nil
}

// MountedImages lists the media the file manager currently holds open.
func MountedImages() []string {
	mountsMu.Lock()
	defer mountsMu.Unlock()

	paths := make([]string, 0, len(mounts))
	for path := range mounts {
		paths = append(paths, path)
	}
	sort.Strings(paths)

	return paths
}

// IsMounted reports whether the file manager currently holds a medium open.
func IsMounted(imagePath string) bool {
	mountsMu.Lock()
	defer mountsMu.Unlock()

	_, ok := mounts[imagePath]
	return ok
}

func attach(imagePath string, kind Kind, writable bool) (*mount, error) {
	if err := os.MkdirAll(MountRoot, 0o700); err != nil {
		return nil, fmt.Errorf("create %s: %w", MountRoot, err)
	}

	mountpoint := filepath.Join(MountRoot, mountName(imagePath))
	if err := os.MkdirAll(mountpoint, 0o700); err != nil {
		return nil, fmt.Errorf("create %s: %w", mountpoint, err)
	}

	loopDevice, err := attachLoop(imagePath, writable)
	if err != nil {
		_ = os.Remove(mountpoint)
		return nil, err
	}

	flags := uintptr(unix.MS_NOEXEC | unix.MS_NOSUID | unix.MS_NODEV)
	if !writable {
		flags |= unix.MS_RDONLY
	}

	if err := unix.Mount(loopDevice, mountpoint, kind.FileSystem(), flags, ""); err != nil {
		detachLoop(loopDevice)
		_ = os.Remove(mountpoint)
		return nil, fmt.Errorf("mount %s as %s: %w", imagePath, kind, err)
	}

	return &mount{
		path:       imagePath,
		mountpoint: mountpoint,
		loopDevice: loopDevice,
		writable:   writable,
	}, nil
}

// mountName builds a filesystem safe directory name that still says which
// medium it belongs to.
func mountName(imagePath string) string {
	sum := sha256.Sum256([]byte(imagePath))

	base := filepath.Base(imagePath)
	base = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '.', r == '-', r == '_':
			return r
		default:
			return '-'
		}
	}, base)

	return base + "-" + hex.EncodeToString(sum[:4])
}

func attachLoop(imagePath string, writable bool) (string, error) {
	device, err := freeLoopDevice()
	if err != nil {
		return "", err
	}

	args := []string{}
	if !writable {
		args = append(args, "-r")
	}
	args = append(args, device, imagePath)

	if out, err := exec.Command("losetup", args...).CombinedOutput(); err != nil {
		return "", fmt.Errorf("losetup %s: %v: %s", imagePath, err, trimOutput(out))
	}

	return device, nil
}

func detachLoop(device string) {
	if device == "" {
		return
	}
	if out, err := exec.Command("losetup", "-d", device).CombinedOutput(); err != nil {
		logrus.Errorf("detach loop device %s failed: %s: %s", device, err, trimOutput(out))
	}
}

func freeLoopDevice() (string, error) {
	for i := 0; i < loopDeviceLimit; i++ {
		name := fmt.Sprintf("loop%d", i)
		device := "/dev/" + name
		if !pathExists(device) {
			continue
		}

		// This kernel only creates the loop attributes once the device has been
		// bound, so a missing backing_file is a free device rather than an
		// error.
		backing, err := os.ReadFile("/sys/block/" + name + "/loop/backing_file")
		if os.IsNotExist(err) {
			return device, nil
		}
		if err == nil && strings.TrimSpace(string(backing)) == "" {
			return device, nil
		}
	}

	return "", errors.New("no free loop device")
}

type handle struct {
	mount  *mount
	closed bool
	mu     sync.Mutex
}

func (h *handle) List(rel string) ([]Entry, error) {
	return listDir(h.mount.mountpoint, rel)
}

func (h *handle) Open(rel string) (io.ReadSeekCloser, Entry, error) {
	return openFile(h.mount.mountpoint, rel)
}

func (h *handle) Write(rel string, r io.Reader) (int64, error) {
	if !h.mount.writable {
		return 0, errors.New("medium is mounted read-only")
	}
	return writeFile(h.mount.mountpoint, rel, r)
}

func (h *handle) Remove(rel string) error {
	return removeFile(h.mount.mountpoint, rel)
}

func (h *handle) StatFS() (total, available uint64, err error) {
	return utils.Statfs(h.mount.mountpoint)
}

// dirHandle is a medium that needs no loop device because it is already a
// directory on a mounted filesystem: the data partition. The emulated disk
// hands that same directory to the target machine, so the file manager reads
// and writes exactly what the target machine sees.
type dirHandle struct {
	root string
}

// OpenDirectory exposes root as a medium. Callers must make sure the target
// machine is not using it at the same time; the file manager does that with
// the disk state.
func OpenDirectory(root string) (Image, error) {
	info, err := os.Stat(root)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("%s is not a directory", root)
	}

	return &dirHandle{root: root}, nil
}

func (h *dirHandle) List(rel string) ([]Entry, error) {
	return listDir(h.root, rel)
}

func (h *dirHandle) Open(rel string) (io.ReadSeekCloser, Entry, error) {
	return openFile(h.root, rel)
}

func (h *dirHandle) Write(rel string, r io.Reader) (int64, error) {
	return writeFile(h.root, rel, r)
}

func (h *dirHandle) Remove(rel string) error {
	return removeFile(h.root, rel)
}

func (h *dirHandle) StatFS() (total, available uint64, err error) {
	return utils.Statfs(h.root)
}

func (h *dirHandle) Close() error {
	return nil
}

func listDir(root, rel string) ([]Entry, error) {
	dir, err := ResolveInside(root, rel)
	if err != nil {
		return nil, err
	}

	dirents, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	entries := make([]Entry, 0, len(dirents))
	for _, dirent := range dirents {
		info, err := dirent.Info()
		if err != nil {
			continue
		}
		entries = append(entries, entryOf(info))
	}

	sort.SliceStable(entries, func(i, j int) bool {
		if entries[i].IsDir != entries[j].IsDir {
			return entries[i].IsDir
		}
		return strings.ToLower(entries[i].Name) < strings.ToLower(entries[j].Name)
	})

	return entries, nil
}

func openFile(root, rel string) (io.ReadSeekCloser, Entry, error) {
	full, err := ResolveInside(root, rel)
	if err != nil {
		return nil, Entry{}, err
	}

	info, err := os.Stat(full)
	if err != nil {
		return nil, Entry{}, err
	}
	if info.IsDir() {
		return nil, Entry{}, fmt.Errorf("%s is a directory", rel)
	}

	file, err := os.Open(full)
	if err != nil {
		return nil, Entry{}, err
	}

	return file, entryOf(info), nil
}

// Write stores r as rel inside the medium and reports how many bytes landed.
// The bytes go to a hidden name first and are renamed into place, so a failed
// or cancelled upload never leaves a half written file where the target
// machine can see it.
func writeFile(root, rel string, r io.Reader) (int64, error) {
	full, err := ResolveInside(root, rel)
	if err != nil {
		return 0, err
	}
	if _, err := os.Stat(full); err == nil {
		return 0, fmt.Errorf("%s already exists", rel)
	}

	tempPath := filepath.Join(filepath.Dir(full), UploadPrefix+randomSuffix())
	file, err := os.OpenFile(tempPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return 0, err
	}

	written, err := io.Copy(file, r)
	if err == nil {
		err = file.Sync()
	}
	if closeErr := file.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		_ = os.Remove(tempPath)
		return 0, err
	}

	if err := os.Rename(tempPath, full); err != nil {
		_ = os.Remove(tempPath)
		return 0, err
	}

	return written, nil
}

func removeFile(root, rel string) error {
	full, err := ResolveInside(root, rel)
	if err != nil {
		return err
	}
	if full == root {
		return errors.New("refusing to remove the medium root")
	}

	// A directory goes with everything it holds: the web UI confirms the
	// delete first, and answering an explicit yes with "directory not empty"
	// helps no one. ResolveInside keeps the walk inside the medium.
	return os.RemoveAll(full)
}

func (h *handle) Close() error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		return nil
	}
	h.closed = true

	mountsMu.Lock()
	defer mountsMu.Unlock()

	h.mount.refs--
	if h.mount.refs > 0 {
		return nil
	}

	delete(mounts, h.mount.path)
	return detach(h.mount)
}

func detach(m *mount) error {
	var errs []error

	if err := unix.Unmount(m.mountpoint, 0); err != nil {
		// A medium the file manager still holds open by accident must not keep
		// the loop device busy forever.
		if lazyErr := unix.Unmount(m.mountpoint, unix.MNT_DETACH); lazyErr != nil {
			errs = append(errs, fmt.Errorf("unmount %s: %w", m.mountpoint, lazyErr))
		}
	}

	detachLoop(m.loopDevice)
	_ = os.Remove(m.mountpoint)

	return errors.Join(errs...)
}

// CleanupStale detaches every mount and loop device left behind under the
// mount root. At startup nothing can be mounted by this process yet, so
// whatever is there is a leftover from a crash, a restart or an update; at
// shutdown it releases the mounts this process still holds.
func CleanupStale() {
	mountsMu.Lock()
	defer mountsMu.Unlock()

	for _, mountpoint := range staleMountpoints() {
		if err := unix.Unmount(mountpoint, unix.MNT_DETACH); err != nil {
			logrus.Errorf("cleanup stale mount %s failed: %s", mountpoint, err)
		}
		// The directory is ours to remove; a non-empty one is left alone.
		_ = os.Remove(mountpoint)
	}

	for _, device := range loopsBackingMedia() {
		detachLoop(device)
	}

	// Mount points are created per medium and only exist while it is mounted,
	// so whatever is still in the root is a leftover. Removing a directory
	// fails while something is mounted on it, which is the safety we want.
	if entries, err := os.ReadDir(MountRoot); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				_ = os.Remove(filepath.Join(MountRoot, entry.Name()))
			}
		}
	}

	mounts = map[string]*mount{}
}

func staleMountpoints() []string {
	data, err := os.ReadFile("/proc/mounts")
	if err != nil {
		return nil
	}

	var paths []string
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		// /proc escapes spaces in mount points; our names never contain any.
		mountpoint := fields[1]
		if mountpoint == MountRoot || strings.HasPrefix(mountpoint, MountRoot+"/") {
			paths = append(paths, mountpoint)
		}
	}

	return paths
}

// loopsBackingMedia finds loop devices whose backing file is a medium, so a
// leftover device is released even when its mount is already gone.
func loopsBackingMedia() []string {
	var devices []string

	for i := 0; i < loopDeviceLimit; i++ {
		name := fmt.Sprintf("loop%d", i)
		backing, err := os.ReadFile("/sys/block/" + name + "/loop/backing_file")
		if err != nil {
			continue
		}

		path := strings.TrimSpace(string(backing))
		if path == "" {
			continue
		}
		if path == utils.MediaDirectory || strings.HasPrefix(path, utils.MediaDirectory+"/") {
			devices = append(devices, "/dev/"+name)
		}
	}

	return devices
}

func entryOf(info os.FileInfo) Entry {
	return Entry{
		Name:    info.Name(),
		Size:    info.Size(),
		IsDir:   info.IsDir(),
		ModTime: info.ModTime(),
	}
}

func randomSuffix() string {
	buf := make([]byte, 4)
	if _, err := rand.Read(buf); err != nil {
		return "00000000"
	}
	return hex.EncodeToString(buf)
}

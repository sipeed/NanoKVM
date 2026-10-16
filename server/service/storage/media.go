package storage

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/utils"
)

// Error codes the web UI reacts to. The response envelope is shared with every
// other endpoint, so these stay inside the media API's own range: the UI needs
// to tell "the target machine is still holding the medium" apart from "you
// have to enable the virtual disk first", and neither apart from a plain
// failure.
const (
	codeInvalidArgument   = -1
	codeOperationFailed   = -2
	codeStorageDisabled   = -10
	codeMediumLocked      = -11
	codeMediumBusy        = -12
	codeNotBrowsable      = -13
	codeInsufficientSpace = -14
	codeNotOptical        = -15
)

// partitionDevice is the whole data partition. It is what the emulated disk
// exposes by default, and while it is attached every medium is at the mercy of
// the target machine, because every medium lives on it.
const partitionDevice = "/dev/mmcblk0p3"

// mediaDirectory holds the media. It is the same directory the virtual disk
// hands to the target machine, so nothing secret belongs in it.
const mediaDirectory = utils.MediaDirectory

// mediumOperationMu serializes the two things that must not interleave: the
// file manager opening a medium and the gadget serving one.
var mediumOperationMu sync.Mutex

// partitionWriteRefs counts long-running writes that land directly on the
// data partition. The counter alone is atomic because a handle releases it
// after openMedium has returned; taking the reference still happens under
// mediumOperationMu, together with the gadget-state check, so a mount cannot
// slip between the two.
var partitionWriteRefs atomic.Int64

// LockVirtualDiskTransition serializes a gadget transition with the media API.
// It applies to disk and network changes because both restart the gadget and
// can make the boot script expose the raw partition. The returned function
// releases the lock and must be deferred by the caller. A transition is refused
// while the file manager holds an image: exposing the raw partition would
// otherwise let the target machine overwrite the image underneath its loop
// device.
func LockVirtualDiskTransition() (func(), error) {
	mediumOperationMu.Lock()
	if err := ensureNoOpenImages(); err != nil {
		mediumOperationMu.Unlock()
		return nil, err
	}
	if partitionWriteRefs.Load() > 0 {
		mediumOperationMu.Unlock()
		return nil, errMediumBusy
	}

	return mediumOperationMu.Unlock, nil
}

func ensureNoOpenImages() error {
	if len(diskfs.MountedImages()) > 0 {
		return errMediumBusy
	}
	return nil
}

var (
	errStorageDisabled = errors.New("the virtual disk is disabled on this device")
	errPartitionOwned  = errors.New("the data partition is attached to the target machine")
	errMediumAttached  = errors.New("the medium is attached to the target machine")
	errMediumBusy      = errors.New("the medium is in use by the file manager")
	errNoSpace         = errors.New("not enough space on the data partition")
	errNotOptical      = errors.New("a CD-ROM can only carry an ISO 9660 image")
	errNotAMedium      = errors.New("the data partition has no file manager of its own")
)

func (s *Service) GetMedia(c *gin.Context) {
	var rsp proto.Response

	media, err := listMedia()
	if err != nil {
		respondError(c, err)
		return
	}

	caps := diskfs.Probe()
	rsp.OkRspWithData(c, &proto.GetMediaRsp{
		Media: media,
		Caps:  proto.MediaCaps{Loop: caps.Loop},
	})

	log.Debugf("get media success, total %d", len(media))
}

func (s *Service) GetMediaState(c *gin.Context) {
	var rsp proto.Response

	status, err := readDiskStatus()
	if err != nil {
		respondError(c, err)
		return
	}

	cdrom, err := readLunBool(lunCDRomFlag)
	if err != nil {
		respondError(c, err)
		return
	}

	state := &proto.MediaStateRsp{
		State:   string(status.State),
		HidOnly: status.HidOnly,
		Open:    openMediaIDs(),
		Cdrom:   cdrom,
	}

	switch status.State {
	case diskStateImage:
		state.Type = proto.MediaTypeImage
		state.Rel = mediaRel(status.Backing)
	case diskStatePartition:
		state.Type = proto.MediaTypePartition
	}

	rsp.OkRspWithData(c, state)
}

func (s *Service) GetMediaStatus(c *gin.Context) {
	var rsp proto.Response

	s.jobMutex.Lock()
	data := &proto.MediaStatusRsp{
		Status:     string(s.jobState),
		Name:       s.jobName,
		Percentage: utils.FormatPercentage(s.jobLoaded, s.jobTotal),
		Loaded:     s.jobLoaded,
		Total:      s.jobTotal,
		Message:    s.jobMessage,
	}
	s.jobMutex.Unlock()

	rsp.OkRspWithData(c, data)
}

func (s *Service) DeleteMedia(c *gin.Context) {
	var req proto.MediaRefReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}
	if req.Type == proto.MediaTypePartition {
		rsp.ErrRsp(c, codeInvalidArgument, "the data partition cannot be deleted")
		return
	}

	backing, err := utils.ResolveMediaID(req.Rel)
	if err != nil {
		respondError(c, err)
		return
	}

	if err := deleteMedium(backing); err != nil {
		respondError(c, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete medium %s success", req.Rel)
}

// deleteMedium keeps the state checks and the unlink in the same critical
// section as gadget attachment. Otherwise a concurrent mount can attach the
// file after the check and leave the gadget reading a deleted inode.
func deleteMedium(backing string) error {
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	status, err := readDiskStatus()
	if err != nil {
		return err
	}
	if status.State == diskStateImage && status.Backing == backing {
		return errMediumAttached
	}
	if status.State == diskStatePartition {
		return errPartitionOwned
	}
	if diskfs.IsMounted(backing) {
		return errMediumBusy
	}

	if err := os.Remove(backing); err != nil {
		return fmt.Errorf("remove %s: %w", backing, err)
	}
	return nil
}

func (s *Service) MountMedia(c *gin.Context) {
	var req proto.MountMediaReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}

	backing, err := resolveBacking(req.Type, req.Rel)
	if err != nil {
		respondError(c, err)
		return
	}

	status, err := readDiskStatus()
	if err != nil {
		respondError(c, err)
		return
	}
	if status.State == diskStateUnsupported {
		respondError(c, errStorageDisabled)
		return
	}
	if diskfs.IsMounted(backing) {
		respondError(c, errMediumBusy)
		return
	}

	// A CD-ROM is an optical disc, so its medium has to hold an ISO 9660
	// filesystem: the gadget then reports 2048 byte sectors, and a partition or
	// any other filesystem read that way is what the target machine reports as
	// a corrupt disc.
	if req.Cdrom {
		kind, err := diskfs.Detect(backing)
		if err != nil || kind != diskfs.KindISO9660 {
			respondError(c, fmt.Errorf("%w: %s", errNotOptical, req.Rel))
			return
		}
	}

	// An image is always served read-only: the target machine must not write the
	// file this side browses, and a read-only medium is what lets this side keep
	// writing /data while it is attached.
	ro := req.Type != proto.MediaTypePartition || req.Cdrom
	if err := s.attachMedium(backing, req.Cdrom, ro, req.Force); err != nil {
		respondError(c, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("mount medium %s (%s) success, cdrom=%v ro=%v", backing, req.Type, req.Cdrom, ro)
}

func (s *Service) EjectMedia(c *gin.Context) {
	var rsp proto.Response

	// The body is optional: without it this is an ordinary eject, which fails
	// when the target machine holds the medium, and the caller retries with
	// force after asking the user.
	var req proto.EjectMediaReq
	_ = proto.ParseFormRequest(c, &req)

	if err := s.detachMedium(req.Force); err != nil {
		respondError(c, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("eject medium success")
}

// attachMedium is the whole mount path: refuse a relabeling that changes
// nothing, then run the kernel's required sequence with the HID devices closed.
func (s *Service) attachMedium(backing string, cdrom, ro, force bool) error {
	// Mounting here and serving the medium to the target machine are two sides
	// of one decision: without the lock, an upload into an image can be opening
	// it read-write while the gadget starts serving the same file.
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	if backing == partitionDevice {
		// Every image lives on the partition. Handing that partition to the
		// target while any image has a loop mount would give both sides the
		// same blocks, even though the partition itself is not in mounts. A
		// direct partition write has no loop mount to check, so it carries an
		// explicit reference instead.
		if err := ensureNoOpenImages(); err != nil {
			return err
		}
		if partitionWriteRefs.Load() > 0 {
			return errMediumBusy
		}
	} else if diskfs.IsMounted(backing) {
		return errMediumBusy
	}

	status, err := readDiskStatus()
	if err != nil {
		return err
	}

	// Attaching what the target machine already has is a no-op: running the
	// sequence again would remove the medium and re-enumerate the gadget under
	// a machine that is using it - and fail with EBUSY if it holds the disk.
	if status.Backing != "" && status.Backing == backing {
		config, err := readLunConfig()
		if err != nil {
			return err
		}
		if config.cdrom == cdrom && config.ro == ro {
			return nil
		}
	}

	err = withHIDLock(func() error {
		err := attach(backing, cdrom, ro)
		if errors.Is(err, ErrMediumLocked) && force {
			// The target machine holds the medium; re-enumerating the gadget
			// is the only way to take it back without its cooperation.
			if err := unbindUDC(); err != nil {
				return err
			}
			err = attach(backing, cdrom, ro)
		}
		return err
	})
	if err != nil {
		// attach may have changed /data before a later step failed. Base the
		// rollback on the state that was actually left behind, not on the
		// state in which the transition started.
		if restoreErr := restoreDataAfterFailedAttach(); restoreErr != nil {
			return errors.Join(err, restoreErr)
		}
	}
	return err
}

func restoreDataAfterFailedAttach() error {
	status, err := readDiskStatus()
	if err != nil {
		return fmt.Errorf("read medium state after failed mount: %w", err)
	}
	if status.State == diskStatePartition {
		return nil
	}
	if err := SetDataWritable(true); err != nil {
		return fmt.Errorf("restore %s writable after failed mount: %w", mediaDirectory, err)
	}
	return nil
}

func (s *Service) detachMedium(force bool) error {
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	status, err := readDiskStatus()
	if err != nil {
		return err
	}
	if status.State == diskStateUnsupported {
		return errStorageDisabled
	}
	if status.State == diskStateNone {
		// Nothing is attached, so there is nothing to release and nothing to
		// re-enumerate.
		return nil
	}

	release := func() error {
		if err := eject(); err != nil {
			return err
		}
		// Nothing is served any more, so the data partition belongs to this
		// side again.
		releaseDataPartition()
		return rebindUDC()
	}

	err = withHIDLock(release)
	if errors.Is(err, ErrMediumLocked) && force {
		err = withHIDLock(func() error {
			if err := unbindUDC(); err != nil {
				return err
			}

			// The lock went away with the re-enumeration, so the medium can be
			// detached now. The gadget is bound again either way: leaving it
			// unbound would cost the target machine its keyboard, mouse and
			// disk until something else rebinds it.
			detachErr := eject()
			releaseDataPartition()
			bindErr := rebindUDC()
			if detachErr != nil {
				return detachErr
			}
			return bindErr
		})
	}

	return err
}

func (s *Service) DownloadMedia(c *gin.Context) {
	var rsp proto.Response

	rel := c.Query("rel")
	if rel == "" || c.Query("type") == proto.MediaTypePartition {
		rsp.ErrRsp(c, codeInvalidArgument, "a disk image is required")
		return
	}

	backing, err := utils.ResolveMediaID(rel)
	if err != nil {
		respondError(c, err)
		return
	}

	status, err := readDiskStatus()
	if err != nil {
		respondError(c, err)
		return
	}
	// Downloading is reading, and a read-only data partition is still readable:
	// the target machine owning the partition does not stop this side from
	// streaming an image file out of it. Its contents may change while it is
	// being served, which is the same caveat the file browser has.
	if status.State == diskStateImage && status.Backing == backing {
		respondError(c, errMediumAttached)
		return
	}
	// A file manager write may be in flight; streaming the image now would
	// hand out a file that changes underneath the download. The pin refuses a
	// writable mount for the whole stream, so the check cannot go stale between
	// here and the open the way a one-shot IsMounted lookup did.
	releasePin, err := diskfs.AcquireReadPin(backing)
	if err != nil {
		respondError(c, err)
		return
	}
	defer releasePin()

	file, err := os.Open(backing)
	if err != nil {
		respondError(c, err)
		return
	}
	defer func() {
		_ = file.Close()
	}()

	info, err := file.Stat()
	if err != nil {
		respondError(c, err)
		return
	}

	c.Header("Content-Disposition", attachmentHeader(filepath.Base(backing)))
	c.Header("Content-Type", "application/octet-stream")
	http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), file)
}

// listMedia returns every image in the media directory plus the data partition
// itself, which stays listed because exposing it over the emulated disk is the
// documented way to drop an image onto the device.
func listMedia() ([]proto.MediaItem, error) {
	// Sizes and names under /data can be written by the target machine at any
	// time; make the walk see them.
	invalidatePartitionCache()

	status, err := readDiskStatus()
	if err != nil {
		return nil, err
	}

	images, err := findImages()
	if err != nil {
		return nil, err
	}

	media := make([]proto.MediaItem, 0, len(images)+1)
	for _, path := range images {
		info, err := os.Stat(path)
		if err != nil {
			continue
		}

		kind, _ := diskfs.Detect(path)
		media = append(media, proto.MediaItem{
			Type:      proto.MediaTypeImage,
			Rel:       mediaRel(path),
			Name:      filepath.Base(path),
			Size:      uint64(info.Size()),
			FS:        string(kind),
			Browsable: kind.Browsable(),
			Attached:  status.Backing == path,
			Modified:  info.ModTime(),
		})
	}

	// The partition is what the emulated disk exposes by default, so it is the
	// medium a user most often has something to fetch from.
	media = append(media, proto.MediaItem{
		Type:      proto.MediaTypePartition,
		Name:      "Shared folder",
		FS:        "exfat",
		Browsable: true,
		Attached:  status.State == diskStatePartition,
	})

	return media, nil
}

// findImages lists what the web UI offers to mount: every .iso and .img on the
// volume, wherever it was put - uploaded here, copied over by the target
// machine, or left by an older version of this feature.
func findImages() ([]string, error) {
	var images []string

	err := filepath.Walk(mediaDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// A device whose data partition was never created has no media,
			// which is not worth failing the whole listing over.
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}
		if !info.IsDir() && utils.IsMediaFile(info.Name()) {
			images = append(images, path)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("list media: %w", err)
	}

	sort.Strings(images)
	return images, nil
}

// resolveBacking maps a request's medium id to the file the gadget would use.
func resolveBacking(mediaType, rel string) (string, error) {
	if mediaType == proto.MediaTypePartition {
		return partitionDevice, nil
	}
	return utils.ResolveMediaID(rel)
}

// mediaRel is the inverse of ResolveMediaID, for reporting a backing file back
// to the web UI.
func mediaRel(backing string) string {
	return strings.TrimPrefix(backing, mediaDirectory+"/")
}

func openMediaIDs() []string {
	mounted := diskfs.MountedImages()
	ids := make([]string, 0, len(mounted))
	for _, path := range mounted {
		ids = append(ids, mediaRel(path))
	}
	return ids
}

// InstallImage atomically replaces destPath with a downloaded or uploaded
// image. The same lock used by gadget and file-manager operations covers both
// the checks and the rename, so the destination cannot become attached or
// loop-mounted in between.
func InstallImage(tempPath, destPath string) error {
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	canonicalDest, err := utils.CanonicalMediaPath(destPath)
	if err != nil {
		return err
	}
	destPath = canonicalDest

	status, err := readDiskStatus()
	if err != nil {
		return err
	}
	return installImage(tempPath, destPath, status, diskfs.IsMounted(destPath))
}

func installImage(tempPath, destPath string, status diskStatus, mounted bool) error {
	if status.State == diskStatePartition {
		return ErrDataPartitionInUse
	}
	if status.State == diskStateImage && status.Backing == destPath {
		return fmt.Errorf("%s is attached to the target machine; eject it there first", filepath.Base(destPath))
	}
	if mounted {
		return fmt.Errorf("%w: %s", errMediumBusy, filepath.Base(destPath))
	}

	if err := os.Rename(tempPath, destPath); err != nil {
		return fmt.Errorf("install image %s: %w", filepath.Base(destPath), err)
	}
	return nil
}

// openMedium returns a handle for a medium that is safe to touch. Everything
// that reads or writes a medium's filesystem goes through here, so the two
// ways to corrupt an image - writing it while the target machine owns it, and
// writing it while the whole data partition is attached - are refused in one
// place.
func openMedium(mediaType, rel string, writable bool) (diskfs.Image, error) {
	// The check and the mount are one step: the gadget must not start serving a
	// medium between the two, or this side ends up writing a filesystem the
	// target machine is reading.
	mediumOperationMu.Lock()
	defer mediumOperationMu.Unlock()

	return openMediumLocked(mediaType, rel, writable)
}

// openMediumLocked is openMedium for a caller that already holds
// mediumOperationMu. Keeping the lock until a subsequent operation finishes
// is necessary when a check alone does not protect that operation, as with a
// file delete through the shared partition.
func openMediumLocked(mediaType, rel string, writable bool) (diskfs.Image, error) {
	status, err := readDiskStatus()
	if err != nil {
		return nil, err
	}
	if status.State == diskStateUnsupported {
		return nil, errStorageDisabled
	}
	// While the data partition is attached, the target machine owns every
	// medium - they all live on it - so nothing from here may write into one:
	// the two sides cache the exFAT allocation tables independently, and a
	// write from this side can hand the target machine clusters it is already
	// using. Reading is fine and needs no such care.
	if writable && status.State == diskStatePartition {
		return nil, errPartitionOwned
	}

	if mediaType == proto.MediaTypePartition {
		// The partition needs no loop device: the emulated disk already hands
		// this very directory to the target machine. A writable handle has to
		// outlive this mutex: without the reference, a mount could take the
		// partition away after open and interrupt the write it returned for.
		image, err := diskfs.OpenDirectory(mediaDirectory)
		if err != nil || !writable {
			return image, err
		}
		partitionWriteRefs.Add(1)
		return &dataPartitionWriteHandle{Image: image}, nil
	}

	backing, err := utils.ResolveMediaID(rel)
	if err != nil {
		return nil, err
	}
	if status.State == diskStateImage && status.Backing == backing {
		return nil, errMediumAttached
	}

	return diskfs.Mount(backing, writable)
}

// dataPartitionWriteHandle keeps the raw partition marked busy until the
// write that opened it has finished and closed the handle.
type dataPartitionWriteHandle struct {
	diskfs.Image
	released atomic.Bool
}

func (h *dataPartitionWriteHandle) Close() error {
	err := h.Image.Close()
	if h.released.CompareAndSwap(false, true) {
		partitionWriteRefs.Add(-1)
	}
	return err
}

// BeginDataPartitionWrite reserves the data partition for a transfer that does
// not go through a medium handle, such as writing a whole image download. The
// reference is taken while the state is checked, then held until release runs;
// handing the raw partition to the target machine is refused in between.
func BeginDataPartitionWrite() (func(), error) {
	mediumOperationMu.Lock()
	status, err := readDiskStatus()
	if err != nil {
		mediumOperationMu.Unlock()
		return nil, err
	}
	if status.State == diskStatePartition {
		mediumOperationMu.Unlock()
		return nil, ErrDataPartitionInUse
	}
	partitionWriteRefs.Add(1)
	mediumOperationMu.Unlock()

	var once sync.Once
	return func() {
		once.Do(func() {
			partitionWriteRefs.Add(-1)
		})
	}, nil
}

// releaseDataPartition hands /data back to this side: it is read-only while the
// emulated disk serves the raw partition, and writable again once no medium or
// a read-only image is attached.
func releaseDataPartition() {
	// SetDataWritable drops the target-owned cache before remounting read-write.
	if err := SetDataWritable(true); err != nil {
		log.Warnf("make %s writable failed: %s", mediaDirectory, err)
	}
}

// attachmentHeader builds the Content-Disposition of a download the way
// browsers want it: an ASCII fallback for everything old, plus the real name
// percent-encoded, because a file name is not necessarily ASCII and %q would
// send a Go-quoted string instead of a name.
func attachmentHeader(name string) string {
	fallback := strings.Map(func(r rune) rune {
		if r < 0x20 || r > 0x7e || r == '"' || r == '\\' {
			return '_'
		}
		return r
	}, name)

	encoded := strings.ReplaceAll(url.PathEscape(name), "'", "%27")

	return fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", fallback, encoded)
}

// ErrDataPartitionInUse reports a write that would land on the data partition
// while the target machine owns it.
var ErrDataPartitionInUse = errors.New("the data partition is attached to the target machine; eject it first")

// EnsureDataPartitionWritable performs the one-shot form of the partition
// ownership check. Anything that keeps writing after the check has to hold
// BeginDataPartitionWrite instead, or the partition can be mounted in between.
func EnsureDataPartitionWritable() error {
	release, err := BeginDataPartitionWrite()
	if err != nil {
		return err
	}
	release()
	return nil
}

// attachedMediumInside reports whether a medium that must not vanish - one
// the target machine holds, or one the file manager keeps mounted - lives
// inside dir. A recursive delete of dir would take that medium with it.
func attachedMediumInside(dir string) bool {
	prefix := dir + string(filepath.Separator)

	status, err := readDiskStatus()
	if err == nil && status.Backing != "" && strings.HasPrefix(status.Backing, prefix) {
		return true
	}

	for _, path := range diskfs.MountedImages() {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}
	return false
}

// IsAttached reports whether the emulated disk is currently backed by path.
// Callers that replace a file in place have to ask first: the gadget keeps
// using the inode it opened, so renaming over it leaves the target machine
// reading a file the rest of the system can no longer see.
func IsAttached(path string) bool {
	if canonical, err := utils.CanonicalMediaPath(path); err == nil {
		path = canonical
	}

	status, err := readDiskStatus()
	if err != nil {
		return false
	}

	return status.Backing != "" && status.Backing == path
}

func respondError(c *gin.Context, err error) {
	var rsp proto.Response

	switch {
	case errors.Is(err, utils.ErrInvalidMediaID), errors.Is(err, utils.ErrInvalidMediaPath):
		rsp.ErrRsp(c, codeInvalidArgument, err.Error())
	case errors.Is(err, errStorageDisabled):
		rsp.ErrRsp(c, codeStorageDisabled, err.Error())
	case errors.Is(err, ErrMediumLocked):
		rsp.ErrRsp(c, codeMediumLocked, err.Error())
	case errors.Is(err, errPartitionOwned), errors.Is(err, errMediumAttached),
		errors.Is(err, errMediumBusy), errors.Is(err, diskfs.ErrBusy):
		rsp.ErrRsp(c, codeMediumBusy, err.Error())
	case errors.Is(err, diskfs.ErrUnsupported), errors.Is(err, errNotAMedium):
		rsp.ErrRsp(c, codeNotBrowsable, err.Error())
	case errors.Is(err, errNoSpace), errors.Is(err, errTooManyJobs):
		rsp.ErrRsp(c, codeInsufficientSpace, err.Error())
	case errors.Is(err, errNotOptical):
		rsp.ErrRsp(c, codeNotOptical, err.Error())
	default:
		rsp.ErrRsp(c, codeOperationFailed, err.Error())
	}
}

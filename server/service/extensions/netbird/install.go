package netbird

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	NetbirdPath = "/usr/bin/netbird"
	// PinnedVersionPath holds the NetBird version this firmware was built against.
	// The binary itself is not bundled: it is published as a release asset and
	// downloaded on demand, the same way Tailscale is.
	PinnedVersionPath    = "/kvmapp/system/netbird/VERSION"
	PinnedSHA256Path     = "/kvmapp/system/netbird/SHA256"
	InstalledVersionPath = "/etc/kvm/netbird.version"
	FirmwareVersionPath  = "/kvmapp/version"

	// NetBird publishes no riscv64 build, so NanoKVM builds one and attaches it
	// to the same immutable firmware release that carries this server. Never use
	// GitHub's mutable `latest` redirect: a later firmware can publish a
	// different NetBird asset with the same filename.
	ReleaseDownloadURL = "https://github.com/sipeed/NanoKVM/releases/download/%s/netbird_riscv64.tgz"
	DownloadURLFile    = "/etc/kvm/netbird_url"

	// Stage on the target filesystem. Promote uses os.Link(O_EXCL semantics) to
	// publish without replacing a daemon's executable; keeping the source under
	// /usr/bin guarantees the link cannot fail with EXDEV on split root/home
	// layouts. The directory is private and removed after every operation.
	Workspace = "/usr/bin/.netbird-install"

	// Keep the server-side deadline below the UI's 10-minute download budget.
	// A timeout is reported as an uncommitted failed install; the slow transfer
	// is never allowed to hold the VPN lifecycle lock.
	downloadTimeout = 8 * time.Minute

	// NetBird is a large Go binary, but these limits make a malformed release
	// asset fail before it can fill the device's small root filesystem. The
	// archive produced by scripts/build-netbird.sh contains exactly three
	// entries, so accepting additional files is never necessary.
	maxNetbirdArchiveSize      int64 = 128 << 20
	maxNetbirdUncompressedSize int64 = 160 << 20
	minNetbirdBinarySize       int64 = 64
	maxNetbirdBinarySize       int64 = 128 << 20
	maxNetbirdVersionSize      int64 = 128
)

var (
	netbirdVersionRE = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+$`)
	sha256HexRE      = regexp.MustCompile(`^[a-f0-9]{64}$`)
)

// ErrNetbirdAlreadyInstalled is returned by Promote when a binary is already
// present. Promotion never replaces an existing executable: the caller must
// explicitly stop and remove an old client under the VPN lifecycle lock before
// promoting a staged update.
var ErrNetbirdAlreadyInstalled = errors.New("netbird is already installed")

// errNetbirdNotAttested is returned by every start path when the binary on disk
// carries no version marker from this installer — a partial install, or a file
// put there by something else. Unlike a version that merely differs from the
// firmware pin, this one is refused: nothing here vouches for that binary.
//
// The repair it names is the one that works. Install refuses to replace a
// binary that is already present, so only Uninstall — which removes the binary,
// the marker and the init script — can clear this state.
var errNetbirdNotAttested = errors.New("no netbird installation this firmware can vouch for; uninstall NetBird and install it again")

// StagedInstall is a downloaded and validated NetBird client. Creating it does
// not touch /usr/bin/netbird and is safe to do without the VPN lifecycle lock.
// Promote must be called by the lifecycle owner while that lock is held.
type StagedInstall struct {
	workspace string
	dir       string
	version   string
	promoted  bool
}

func downloadURL() (string, error) {
	if custom := readVersion(DownloadURLFile); custom != "" {
		// A local admin/test override is intentionally explicit. It remains
		// subject to the archive/version/ELF validation below.
		return custom, nil
	}

	firmwareVersion := readVersion(FirmwareVersionPath)
	if !netbirdVersionRE.MatchString(firmwareVersion) {
		return "", fmt.Errorf("invalid firmware version %q for netbird release URL", firmwareVersion)
	}
	return fmt.Sprintf(ReleaseDownloadURL, firmwareVersion), nil
}

func isInstalled() bool {
	_, err := os.Stat(NetbirdPath)
	return err == nil
}

// CanStartAtBoot reports whether the NetBird client is eligible for S95's
// restore-and-start path. The executable and recovery init script must both be
// usable, and the installed binary must carry this installer's version marker.
//
// It deliberately does not require that marker to equal the firmware pin. A
// binary older than the pin is still a binary this installer validated and
// published; refusing to boot it would disconnect, on the next firmware
// update, exactly those devices that are reachable only through NetBird. The
// version difference is reported to the UI instead, and it gates updating, not
// running.
func CanStartAtBoot() bool {
	return canStartAtBoot(NetbirdPath, ScriptBackupPath, getInstalledVersion())
}

func canStartAtBoot(binaryPath, scriptPath, installedVersion string) bool {
	return isExecutable(binaryPath) &&
		isRegularFile(scriptPath) &&
		installAttested(installedVersion)
}

// S95 copies the immutable recovery script to /etc/init.d and chmods that
// copy, so the source script itself need only be a regular file.
func isRegularFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular()
}

// install is the compatibility path for an initial install. It never replaces
// an existing executable; callers that need an update must StageInstall before
// acquiring the VPN lifecycle lock, then stop/remove the old client and call
// Promote under that lock.
func install(force bool) error {
	if isInstalled() {
		if !force || isUpToDate() {
			return nil
		}

		// The old implementation silently renamed a new binary over the
		// executable of a running daemon. Keep install's initial-install
		// compatibility, but make an update use StageInstall plus explicit
		// lifecycle orchestration instead.
		return ErrNetbirdAlreadyInstalled
	}

	staged, err := StageInstall()
	if err != nil {
		return err
	}
	defer func() { _ = staged.Cleanup() }()

	return staged.Promote()
}

// StageInstall downloads and validates a release asset in a private workspace.
// It intentionally has no knowledge of VPN locks or daemon state, so callers
// can do the slow network operation before entering their critical section.
func StageInstall() (*StagedInstall, error) {
	return StageInstallContext(context.Background())
}

// StageInstallContext is StageInstall with cancellation for a newer lifecycle
// request. It is deliberately used outside vpnpref's critical section: cancel
// stops the HTTP transfer and prevents a stale Start/Install from promoting
// after Stop or Uninstall has completed.
func StageInstallContext(ctx context.Context) (*StagedInstall, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(Workspace, 0o755); err != nil {
		return nil, fmt.Errorf("create netbird workspace: %w", err)
	}
	workspace, err := os.MkdirTemp(Workspace, ".stage-")
	if err != nil {
		return nil, fmt.Errorf("create netbird staging workspace: %w", err)
	}
	cleanup := true
	defer func() {
		if cleanup {
			_ = os.RemoveAll(workspace)
		}
	}()

	tarFile := filepath.Join(workspace, "netbird_riscv64.tgz")

	// download
	if err := downloadContext(ctx, tarFile); err != nil {
		log.Errorf("failed to download netbird: %s", err)
		return nil, err
	}
	if err := verifyPinnedArchiveDigest(tarFile); err != nil {
		return nil, err
	}

	// Validate and extract only the two files created by build-netbird.sh.
	// Do not use the generic archive helper here: installers must reject path
	// traversal, links, extra payloads and a binary for another architecture.
	pinnedVersion := getPinnedVersion()
	dir, downloadedVersion, err := validateAndExtractArchive(tarFile, workspace, pinnedVersion)
	if err != nil {
		log.Errorf("failed to validate netbird archive: %s", err)
		return nil, err
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	cleanup = false
	return &StagedInstall{
		workspace: workspace,
		dir:       dir,
		version:   downloadedVersion,
	}, nil
}

// Promote installs the staged binary atomically, but only when no NetBird
// binary currently exists. os.Link atomically creates the destination without
// replacing a concurrent or running executable. Workspace is below /usr/bin,
// so the source and destination are guaranteed to share a filesystem.
func (staged *StagedInstall) Promote() error {
	return staged.promote(NetbirdPath, InstalledVersionPath)
}

// promote is Promote with explicit paths so its filesystem guarantees can be
// tested without writing to the device's /usr/bin.
func (staged *StagedInstall) promote(binaryPath, versionPath string) error {
	if staged == nil {
		return fmt.Errorf("nil staged netbird install")
	}
	if staged.promoted {
		return nil
	}
	if err := staged.validate(); err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(binaryPath), 0o755); err != nil {
		return fmt.Errorf("create netbird binary directory: %w", err)
	}
	binary := filepath.Join(staged.dir, "netbird")
	if err := os.Chmod(binary, 0o755); err != nil {
		return fmt.Errorf("chmod staged netbird: %w", err)
	}
	// A hard link preserves the staged inode's data and mode. Sync that inode
	// first: a durable version marker must never certify a binary whose content
	// has not been flushed yet.
	if err := syncFile(binary); err != nil {
		return fmt.Errorf("sync staged netbird binary: %w", err)
	}
	if err := os.Link(binary, binaryPath); err != nil {
		if errors.Is(err, fs.ErrExist) {
			return ErrNetbirdAlreadyInstalled
		}
		return fmt.Errorf("atomically promote staged netbird: %w", err)
	}
	if err := syncDirectory(filepath.Dir(binaryPath)); err != nil {
		return fmt.Errorf("sync netbird binary directory: %w", rollbackPromotedBinary(binary, binaryPath, err))
	}

	// Publish the marker only after the binary link is visible and durable. The
	// marker is the certificate that Start uses to trust an installed binary, so
	// a collision or failed Link must never overwrite it. If publishing fails
	// before rename, remove only the link made by this transaction. A failure
	// after rename is intentionally not rolled back: the marker may already be
	// live, and the binary was made durable first; return an error and do not
	// start the daemon in this request.
	published, err := publishVersion(versionPath, staged.version)
	if err != nil {
		if !published {
			return fmt.Errorf("publish netbird version: %w", rollbackPromotedBinary(binary, binaryPath, err))
		}
		return fmt.Errorf("publish netbird version after binary promotion: %w", err)
	}
	staged.promoted = true
	if err := os.Remove(binary); err != nil {
		// The installed link and metadata are already committed. Cleanup will
		// retry removal of this private staging directory; do not lie that a
		// successful installation failed.
		log.Warnf("could not remove promoted netbird staging link: %s", err)
	}

	log.Debugf("install netbird successfully")
	return nil
}

// Replace publishes a staged binary over an existing installation. Promote
// refuses to do that: it uses os.Link, which cannot overwrite, because an
// install must never swap the executable of a daemon that is running.
//
// An update is the one case where replacement is the point, so the caller must
// have stopped the daemon and must hold the VPN lifecycle lock. The old binary
// is kept aside until the new version marker is durable, so a failure anywhere
// in the sequence puts the previous client back rather than leaving a device
// with a binary and a marker that disagree, or with no binary at all.
func (staged *StagedInstall) Replace() error {
	return staged.replace(NetbirdPath, InstalledVersionPath)
}

func (staged *StagedInstall) replace(binaryPath, versionPath string) (err error) {
	if staged == nil {
		return fmt.Errorf("nil staged netbird install")
	}
	if staged.promoted {
		return nil
	}
	if err := staged.validate(); err != nil {
		return err
	}

	binary := filepath.Join(staged.dir, "netbird")
	if err := os.Chmod(binary, 0o755); err != nil {
		return fmt.Errorf("chmod staged netbird: %w", err)
	}
	// The marker must never certify content that is not on the disk yet.
	if err := syncFile(binary); err != nil {
		return fmt.Errorf("sync staged netbird binary: %w", err)
	}

	directory := filepath.Dir(binaryPath)
	incoming := filepath.Join(directory, fmt.Sprintf(".netbird.new.%d", os.Getpid()))
	previous := filepath.Join(directory, fmt.Sprintf(".netbird.old.%d", os.Getpid()))
	// Leftovers from an interrupted replacement are ~40 MB each on a small root
	// filesystem, and the process that made them is gone, so its pid will never
	// clean them up. This runs under the lifecycle lock, so no concurrent
	// replacement owns them.
	removeReplacementLeftovers(directory)
	if err := os.Link(binary, incoming); err != nil {
		return fmt.Errorf("stage netbird replacement: %w", err)
	}
	defer func() {
		if removeErr := os.Remove(incoming); removeErr != nil && !errors.Is(removeErr, fs.ErrNotExist) {
			log.Warnf("could not remove netbird replacement stage: %s", removeErr)
		}
	}()

	// Keep the old executable reachable under a second name. A hard link, not a
	// rename: renaming it away would leave /usr/bin/netbird absent until the
	// next rename lands, and a power loss in that window would leave the device
	// with no client at all — which for a NetBird-only device means no way back
	// in. Linking costs nothing (same inode) and makes the publish below a
	// single rename over an existing name. Restoring is then also one rename.
	restore := func() {}
	if err := os.Link(binaryPath, previous); err != nil {
		if !errors.Is(err, fs.ErrNotExist) {
			return fmt.Errorf("set aside installed netbird: %w", err)
		}
	} else {
		defer func() {
			if removeErr := os.Remove(previous); removeErr != nil && !errors.Is(removeErr, fs.ErrNotExist) {
				log.Warnf("could not remove the replaced netbird binary: %s", removeErr)
			}
		}()
		restore = func() {
			if restoreErr := os.Rename(previous, binaryPath); restoreErr != nil {
				log.Errorf("could not restore the previous netbird binary: %s", restoreErr)
			}
		}
	}

	if err := os.Rename(incoming, binaryPath); err != nil {
		restore()
		return fmt.Errorf("publish netbird replacement: %w", err)
	}
	if err := syncDirectory(directory); err != nil {
		restore()
		return fmt.Errorf("sync netbird binary directory: %w", err)
	}

	published, err := publishVersion(versionPath, staged.version)
	if err != nil {
		if published {
			// The marker is live and names the new binary, which is already
			// durable. Restoring the old one now would create the mismatch
			// this ordering exists to avoid.
			return fmt.Errorf("publish netbird version after binary replacement: %w", err)
		}
		restore()
		return fmt.Errorf("publish netbird version: %w", err)
	}

	staged.promoted = true
	log.Debugf("replaced netbird with %s", staged.version)
	return nil
}

// Cleanup removes the private staging workspace. It is safe after Promote:
// promotion creates a hard link in /usr/bin before this workspace is removed.
func (staged *StagedInstall) Cleanup() error {
	if staged == nil || staged.workspace == "" {
		return nil
	}
	err := os.RemoveAll(staged.workspace)
	if err == nil {
		staged.workspace = ""
	}
	return err
}

func (staged *StagedInstall) validate() error {
	if staged.workspace == "" || staged.dir == "" || !netbirdVersionRE.MatchString(staged.version) {
		return fmt.Errorf("invalid staged netbird install")
	}
	relative, err := filepath.Rel(staged.workspace, staged.dir)
	if err != nil || relative == "." || relative == ".." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) || filepath.IsAbs(relative) {
		return fmt.Errorf("staged netbird directory escapes its workspace")
	}

	binary := filepath.Join(staged.dir, "netbird")
	info, err := os.Lstat(binary)
	if err != nil {
		return fmt.Errorf("stat staged netbird binary: %w", err)
	}
	if !info.Mode().IsRegular() || !validNetbirdEntrySize("netbird_"+staged.version+"_riscv64/netbird", "netbird_"+staged.version+"_riscv64", info.Size()) {
		return fmt.Errorf("invalid staged netbird binary")
	}
	if err := validateRISCVELF(binary); err != nil {
		return err
	}

	version, err := os.ReadFile(filepath.Join(staged.dir, "VERSION"))
	if err != nil {
		return fmt.Errorf("read staged netbird version: %w", err)
	}
	if strings.TrimSpace(string(version)) != staged.version {
		return fmt.Errorf("staged netbird version does not match validation result")
	}
	return nil
}

// validateAndExtractArchive accepts only the archive format emitted by
// scripts/build-netbird.sh:
//
//	netbird_<version>_riscv64/
//	netbird_<version>_riscv64/VERSION
//	netbird_<version>_riscv64/netbird
//
// Extraction happens in a new private directory and the directory is removed
// on every validation failure. Callers therefore never observe an unvalidated
// binary in Workspace.
func validateAndExtractArchive(archivePath, workspace, expectedVersion string) (dir, version string, err error) {
	if !netbirdVersionRE.MatchString(expectedVersion) {
		return "", "", fmt.Errorf("invalid pinned netbird version %q", expectedVersion)
	}

	info, err := os.Lstat(archivePath)
	if err != nil {
		return "", "", fmt.Errorf("stat netbird archive: %w", err)
	}
	if !info.Mode().IsRegular() {
		return "", "", fmt.Errorf("netbird archive is not a regular file")
	}
	if info.Size() > maxNetbirdArchiveSize {
		return "", "", fmt.Errorf("netbird archive exceeds %d byte limit", maxNetbirdArchiveSize)
	}

	archive, err := os.Open(archivePath)
	if err != nil {
		return "", "", fmt.Errorf("open netbird archive: %w", err)
	}
	defer func() { _ = archive.Close() }()

	gz, err := gzip.NewReader(archive)
	if err != nil {
		return "", "", fmt.Errorf("open netbird gzip stream: %w", err)
	}
	defer func() { _ = gz.Close() }()

	stage, err := os.MkdirTemp(workspace, ".netbird-")
	if err != nil {
		return "", "", fmt.Errorf("create netbird extraction directory: %w", err)
	}
	success := false
	defer func() {
		if !success {
			_ = os.RemoveAll(stage)
		}
	}()

	root := fmt.Sprintf("netbird_%s_riscv64", expectedVersion)
	expected := map[string]byte{
		root:              tar.TypeDir,
		root + "/VERSION": tar.TypeReg,
		root + "/netbird": tar.TypeReg,
	}
	seen := make(map[string]bool, len(expected))
	// Drain the gzip stream below as well. Besides enforcing the limit over tar
	// headers and padding, this makes gzip verify its checksum instead of
	// accepting a truncated archive after tar has seen its end marker.
	limited := &io.LimitedReader{R: gz, N: maxNetbirdUncompressedSize + 1}
	reader := tar.NewReader(limited)
	var total int64
	var extractedVersion string

	for {
		header, nextErr := reader.Next()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			return "", "", fmt.Errorf("read netbird archive: %w", nextErr)
		}
		if header.Name == "" || filepath.IsAbs(header.Name) || strings.Contains(header.Name, "\\") ||
			strings.HasPrefix(header.Name, "../") || strings.Contains(header.Name, "/../") {
			return "", "", fmt.Errorf("unsafe netbird archive path %q", header.Name)
		}

		name := header.Name
		// GNU tar emits the archive root as "root/". Canonicalize precisely
		// that directory spelling and nothing else: files, root//, root/. and
		// every other unexpected path remain invalid input.
		if header.Typeflag == tar.TypeDir && name == root+"/" {
			name = root
		}

		expectedType, ok := expected[name]
		if !ok {
			return "", "", fmt.Errorf("unexpected netbird archive entry %q", header.Name)
		}
		if seen[name] {
			return "", "", fmt.Errorf("duplicate netbird archive entry %q", header.Name)
		}
		if !validArchiveType(header.Typeflag, expectedType) {
			return "", "", fmt.Errorf("netbird archive entry %q has unsafe type %q", header.Name, header.Typeflag)
		}
		if !validNetbirdEntrySize(name, root, header.Size) || total+header.Size > maxNetbirdUncompressedSize {
			return "", "", fmt.Errorf("netbird archive entry %q exceeds size limit", header.Name)
		}
		total += header.Size
		seen[name] = true

		if header.Typeflag == tar.TypeDir {
			if header.Size != 0 {
				return "", "", fmt.Errorf("netbird archive directory %q has content", header.Name)
			}
			if err := os.MkdirAll(filepath.Join(stage, root), 0o755); err != nil {
				return "", "", fmt.Errorf("create netbird archive directory: %w", err)
			}
			continue
		}

		if err := os.MkdirAll(filepath.Join(stage, root), 0o755); err != nil {
			return "", "", fmt.Errorf("create netbird archive directory: %w", err)
		}
		target := filepath.Join(stage, filepath.FromSlash(header.Name))
		file, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
		if err != nil {
			return "", "", fmt.Errorf("create netbird archive entry %q: %w", header.Name, err)
		}
		_, copyErr := io.Copy(file, reader)
		closeErr := file.Close()
		if copyErr != nil {
			return "", "", fmt.Errorf("extract netbird archive entry %q: %w", header.Name, copyErr)
		}
		if closeErr != nil {
			return "", "", fmt.Errorf("close netbird archive entry %q: %w", header.Name, closeErr)
		}

		if header.Name == root+"/VERSION" {
			content, err := os.ReadFile(target)
			if err != nil {
				return "", "", fmt.Errorf("read archive version: %w", err)
			}
			extractedVersion = strings.TrimSpace(string(content))
		}
	}
	if err := drainZeroTarPadding(limited); err != nil {
		return "", "", fmt.Errorf("validate netbird archive stream: %w", err)
	}
	if limited.N == 0 {
		return "", "", fmt.Errorf("netbird archive exceeds %d byte uncompressed limit", maxNetbirdUncompressedSize)
	}

	if len(seen) != len(expected) {
		return "", "", fmt.Errorf("netbird archive is incomplete")
	}
	if extractedVersion != expectedVersion || !netbirdVersionRE.MatchString(extractedVersion) {
		return "", "", fmt.Errorf("netbird archive version %q does not match pinned version %q", extractedVersion, expectedVersion)
	}
	if err := validateRISCVELF(filepath.Join(stage, root, "netbird")); err != nil {
		return "", "", err
	}

	success = true
	return filepath.Join(stage, root), extractedVersion, nil
}

func verifyPinnedArchiveDigest(archivePath string) error {
	expected := readVersion(PinnedSHA256Path)
	if !sha256HexRE.MatchString(expected) {
		return fmt.Errorf("invalid pinned netbird SHA-256 %q", expected)
	}
	return verifyArchiveDigest(archivePath, expected)
}

func verifyArchiveDigest(archivePath, expected string) error {
	if !sha256HexRE.MatchString(expected) {
		return fmt.Errorf("invalid expected netbird SHA-256 %q", expected)
	}
	archive, err := os.Open(archivePath)
	if err != nil {
		return fmt.Errorf("open netbird archive for checksum: %w", err)
	}
	defer func() { _ = archive.Close() }()

	hash := sha256.New()
	written, err := io.Copy(hash, io.LimitReader(archive, maxNetbirdArchiveSize+1))
	if err != nil {
		return fmt.Errorf("hash netbird archive: %w", err)
	}
	if written > maxNetbirdArchiveSize {
		return fmt.Errorf("netbird archive exceeds %d byte limit", maxNetbirdArchiveSize)
	}
	actual := fmt.Sprintf("%x", hash.Sum(nil))
	if subtle.ConstantTimeCompare([]byte(actual), []byte(expected)) != 1 {
		return fmt.Errorf("netbird archive SHA-256 does not match firmware pin")
	}
	return nil
}

func drainZeroTarPadding(reader io.Reader) error {
	var buffer [32 * 1024]byte
	for {
		count, err := reader.Read(buffer[:])
		for _, value := range buffer[:count] {
			if value != 0 {
				return fmt.Errorf("unexpected data after netbird tar end marker")
			}
		}
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
	}
}

func validArchiveType(actual, expected byte) bool {
	if expected == tar.TypeDir {
		return actual == tar.TypeDir
	}
	return actual == tar.TypeReg || actual == tar.TypeRegA
}

func maxSizeForNetbirdEntry(name, root string) int64 {
	if name == root+"/VERSION" {
		return maxNetbirdVersionSize
	}
	if name == root+"/netbird" {
		return maxNetbirdBinarySize
	}
	return 0
}

func validNetbirdEntrySize(name, root string, size int64) bool {
	if size < 0 || size > maxSizeForNetbirdEntry(name, root) {
		return false
	}
	return name != root+"/netbird" || size >= minNetbirdBinarySize
}

func validateRISCVELF(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open netbird binary: %w", err)
	}
	defer func() { _ = file.Close() }()

	var header [64]byte
	if _, err := io.ReadFull(file, header[:]); err != nil {
		return fmt.Errorf("read netbird ELF header: %w", err)
	}
	if string(header[:4]) != "\x7fELF" || header[4] != 2 || header[5] != 1 || header[6] != 1 ||
		header[18] != 243 || header[19] != 0 || header[20] != 1 || header[21] != 0 || header[22] != 0 || header[23] != 0 ||
		header[52] != 64 || header[53] != 0 {
		return fmt.Errorf("netbird binary is not a 64-bit little-endian riscv64 ELF")
	}

	return nil
}

// removeReplacementLeftovers clears the staging names Replace uses. It ignores
// failures: they are reported by the operation that needed the space.
func removeReplacementLeftovers(directory string) {
	for _, pattern := range []string{".netbird.new.*", ".netbird.old.*"} {
		matches, err := filepath.Glob(filepath.Join(directory, pattern))
		if err != nil {
			continue
		}
		for _, match := range matches {
			if removeErr := os.Remove(match); removeErr != nil && !errors.Is(removeErr, fs.ErrNotExist) {
				log.Warnf("could not remove netbird replacement leftover %s: %s", match, removeErr)
			}
		}
	}
}

func uninstall() error {
	removeReplacementLeftovers(filepath.Dir(NetbirdPath))

	var removeErrs []error
	for _, path := range []string{NetbirdPath, InstalledVersionPath, ScriptPath, PidFile} {
		if err := os.Remove(path); err != nil && !errors.Is(err, fs.ErrNotExist) {
			removeErrs = append(removeErrs, fmt.Errorf("remove %s: %w", path, err))
		}
	}
	return errors.Join(removeErrs...)
}

func download(target string) error {
	return downloadContext(context.Background(), target)
}

func downloadContext(ctx context.Context, target string) error {
	// A bare http.Get has no deadline. This runs while the VPN lock is held, so
	// a hung connection would block every other VPN operation until reboot.
	client := &http.Client{Timeout: downloadTimeout}

	url, err := downloadURL()
	if err != nil {
		return err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create netbird download request: %w", err)
	}
	resp, err := client.Do(request)
	if err != nil {
		log.Errorf("failed to download netbird: %s", err)
		return err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	if resp.ContentLength > maxNetbirdArchiveSize {
		return fmt.Errorf("netbird download exceeds %d byte limit", maxNetbirdArchiveSize)
	}

	out, err := os.Create(target)
	if err != nil {
		log.Errorf("failed to create file: %s", err)
		return err
	}
	defer func() {
		_ = out.Close()
	}()

	written, err := io.Copy(out, io.LimitReader(resp.Body, maxNetbirdArchiveSize+1))
	if err != nil {
		log.Errorf("failed to copy response body to file: %s", err)
		return err
	}
	if written > maxNetbirdArchiveSize {
		return fmt.Errorf("netbird download exceeds %d byte limit", maxNetbirdArchiveSize)
	}

	log.Debugf("download netbird successfully")
	return nil
}

// isUpToDate reports whether the installed binary is the one this firmware
// pins. It decides whether an update is offered — never whether the installed
// client may run; see CanStartAtBoot.
func isUpToDate() bool {
	return versionsMatch(getPinnedVersion(), getInstalledVersion())
}

// UpdateAvailable reports whether this firmware pins a different NetBird
// release than the one installed. An unreadable or malformed pin is not an
// update: there is nothing to offer, and saying otherwise would advertise an
// upgrade that cannot be performed.
func UpdateAvailable() bool {
	pinned := getPinnedVersion()
	installed := getInstalledVersion()
	return netbirdVersionRE.MatchString(pinned) &&
		installAttested(installed) &&
		pinned != installed
}

// installAttested reports whether the version marker certifies that this
// installer published the binary next to it. promote writes the marker only
// after the validated binary is linked and synced, and rolls that link back if
// the marker cannot be written (see promote), so a binary without a well-formed
// marker did not come from here and is not started.
func installAttested(installed string) bool {
	return netbirdVersionRE.MatchString(installed)
}

// versionsMatch is deliberately stricter than a non-empty string comparison:
// a corrupt marker must never certify a binary as being the pinned release.
func versionsMatch(pinned, installed string) bool {
	return netbirdVersionRE.MatchString(pinned) && pinned == installed
}

func writeInstalledVersion(version string) error {
	return writeVersion(InstalledVersionPath, version)
}

func writeVersion(versionPath, version string) error {
	_, err := publishVersion(versionPath, version)
	return err
}

// publishVersion atomically replaces a version marker. Its boolean result is
// true once rename has succeeded, even if syncing the directory then fails.
// Callers that publish a binary immediately before the marker need that
// distinction: after rename the marker may be visible and rolling the binary
// back would create the inverse, unsafe mismatch.
func publishVersion(versionPath, version string) (published bool, err error) {
	if !netbirdVersionRE.MatchString(version) {
		return false, fmt.Errorf("invalid installed netbird version %q", version)
	}

	directory := filepath.Dir(versionPath)
	if err := os.MkdirAll(directory, 0o755); err != nil {
		return false, fmt.Errorf("create version dir failed: %w", err)
	}

	file, err := os.CreateTemp(directory, ".netbird.version-")
	if err != nil {
		return false, fmt.Errorf("create version file: %w", err)
	}
	temporaryPath := file.Name()
	defer func() { _ = os.Remove(temporaryPath) }()
	if err := file.Chmod(0o644); err != nil {
		_ = file.Close()
		return false, fmt.Errorf("chmod version file: %w", err)
	}
	if _, err := io.WriteString(file, version+"\n"); err != nil {
		_ = file.Close()
		return false, fmt.Errorf("write version file: %w", err)
	}
	if err := file.Sync(); err != nil {
		_ = file.Close()
		return false, fmt.Errorf("sync version file: %w", err)
	}
	if err := file.Close(); err != nil {
		return false, fmt.Errorf("close version file: %w", err)
	}
	if err := os.Rename(temporaryPath, versionPath); err != nil {
		return false, fmt.Errorf("publish version file: %w", err)
	}
	if err := syncDirectory(directory); err != nil {
		return true, fmt.Errorf("sync version directory: %w", err)
	}
	return true, nil
}

func syncFile(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = file.Close() }()
	return file.Sync()
}

// rollbackPromotedBinary removes a link only if it is still the staged inode
// this operation published. It preserves a concurrent replacement and joins
// any rollback/sync failures with the original failure for callers.
func rollbackPromotedBinary(source, destination string, cause error) error {
	sourceInfo, sourceErr := os.Lstat(source)
	destinationInfo, destinationErr := os.Lstat(destination)
	if sourceErr != nil || destinationErr != nil || !os.SameFile(sourceInfo, destinationInfo) {
		return cause
	}

	if err := os.Remove(destination); err != nil {
		return errors.Join(cause, fmt.Errorf("rollback netbird binary: %w", err))
	}
	if err := syncDirectory(filepath.Dir(destination)); err != nil {
		return errors.Join(cause, fmt.Errorf("sync netbird binary rollback: %w", err))
	}
	return cause
}

func syncDirectory(path string) error {
	directory, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = directory.Close() }()
	return directory.Sync()
}

func getPinnedVersion() string {
	return readVersion(PinnedVersionPath)
}

func getInstalledVersion() string {
	return readVersion(InstalledVersionPath)
}

func readVersion(path string) string {
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}

	return strings.TrimSpace(string(content))
}

package utils

import (
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

// MediaDirectory is the volume the emulated USB disk exposes: the target
// machine sees it as one removable drive, so nothing secret belongs here.
//
// It is split into two folders so both sides know what they are looking at:
// the shared folder is the drop box for exchanging files, the images folder is
// this device's own library of disk images.
const (
	MediaDirectory  = "/data"
	ShareDirectory  = MediaDirectory + "/share"
	ImagesDirectory = MediaDirectory + "/images"
)

// maxNameLength is the FAT/exFAT limit in UTF-16 code units; counting runes is
// the closest practical approximation on the Go side.
const maxNameLength = 255

// forbiddenNameChars cannot appear in a name on any platform that mounts
// FAT/exFAT, so the file manager rejects them before the kernel sees them.
const forbiddenNameChars = `<>:"/\|?*`

// reservedNames are the DOS device names Windows still refuses, with or
// without an extension.
var reservedNames = map[string]bool{
	"CON": true, "PRN": true, "AUX": true, "NUL": true,
	"COM1": true, "COM2": true, "COM3": true, "COM4": true, "COM5": true,
	"COM6": true, "COM7": true, "COM8": true, "COM9": true,
	"LPT1": true, "LPT2": true, "LPT3": true, "LPT4": true, "LPT5": true,
	"LPT6": true, "LPT7": true, "LPT8": true, "LPT9": true,
}

var (
	ErrInvalidMediaID   = errors.New("invalid medium id")
	ErrInvalidMediaPath = errors.New("invalid media path")
)

// IsMediaFile reports whether name looks like a virtual medium. The emulated
// disk only ever exposes disk images, so the file manager refuses to touch
// anything else in MediaDirectory.
func IsMediaFile(name string) bool {
	return IsISOFile(name) || strings.HasSuffix(strings.ToLower(filepath.Base(name)), ".img")
}

// IsISOFile reports whether name is an ISO image, which is the one medium
// whose contents can be checked before it is mounted.
func IsISOFile(name string) bool {
	return strings.HasSuffix(strings.ToLower(filepath.Base(name)), ".iso")
}

// ResolveMediaID turns a medium id, a path relative to MediaDirectory, into an
// absolute path. Every request naming a file on the device goes through here,
// so escapes (absolute paths, "..", separators where they do not belong) are
// rejected rather than patched up at the call site.
func ResolveMediaID(id string) (string, error) {
	id = strings.TrimSpace(id)
	if id == "" || strings.ContainsRune(id, 0) {
		return "", fmt.Errorf("%w: empty", ErrInvalidMediaID)
	}
	if strings.HasPrefix(id, "/") || strings.HasPrefix(id, `\`) {
		return "", fmt.Errorf("%w: must be relative to %s", ErrInvalidMediaID, MediaDirectory)
	}

	rel := filepath.FromSlash(id)
	if !filepath.IsLocal(rel) {
		return "", fmt.Errorf("%w: %s escapes %s", ErrInvalidMediaID, id, MediaDirectory)
	}

	for _, segment := range strings.Split(filepath.ToSlash(rel), "/") {
		if err := validateName(segment); err != nil {
			return "", fmt.Errorf("%w: %s", ErrInvalidMediaID, err)
		}
	}

	if !IsMediaFile(rel) {
		return "", fmt.Errorf("%w: %s is not a disk image", ErrInvalidMediaID, id)
	}

	return canonicalMediaPath(MediaDirectory, rel)
}

// CanonicalMediaPath resolves an absolute medium path to the spelling used by
// the directory entries on disk. Like ResolveMediaID, it rejects paths outside
// MediaDirectory and names that are not disk images.
func CanonicalMediaPath(name string) (string, error) {
	rel, err := filepath.Rel(MediaDirectory, filepath.Clean(name))
	if err != nil || !filepath.IsLocal(rel) {
		return "", fmt.Errorf("%w: %s is outside %s", ErrInvalidMediaID, name, MediaDirectory)
	}

	return ResolveMediaID(filepath.ToSlash(rel))
}

// CanonicalPathInside resolves rel, a path already checked by
// ValidateMediumPath, to the spelling the directory entries under root use.
// Unlike CanonicalMediaPath it accepts directories and arbitrary files: a
// delete has to compare what it removes against the canonical paths of the
// attached and mounted media, and "IMAGES" names the same exFAT directory as
// "images".
func CanonicalPathInside(root, rel string) (string, error) {
	if rel == "" || rel == "/" {
		return root, nil
	}
	return canonicalMediaPath(root, filepath.FromSlash(rel))
}

// canonicalMediaPath resolves every existing component to its on-disk name.
// exFAT lookups are case-insensitive, while Go string comparisons are not: an
// all-lower-case request and an upper-case request can name the same medium.
// Prefer an exact match so this also remains deterministic on a case-sensitive
// filesystem, and reject ambiguous folds instead of choosing between files.
// A missing component is kept as requested so callers can still create a new
// image or report the original not-found error.
func canonicalMediaPath(root, rel string) (string, error) {
	segments := strings.Split(filepath.ToSlash(rel), "/")
	current := root

	for i, segment := range segments {
		entries, err := os.ReadDir(current)
		if err != nil {
			if os.IsNotExist(err) {
				parts := append([]string{current}, segments[i:]...)
				return filepath.Join(parts...), nil
			}
			return "", fmt.Errorf("resolve medium path %s: %w", filepath.Join(root, rel), err)
		}

		matches := make([]string, 0, 1)
		for _, entry := range entries {
			if entry.Name() == segment {
				matches = []string{segment}
				break
			}
			if strings.EqualFold(entry.Name(), segment) {
				matches = append(matches, entry.Name())
			}
		}

		if len(matches) > 1 {
			return "", fmt.Errorf("%w: %s has more than one case-insensitive match", ErrInvalidMediaID, filepath.Join(root, rel))
		}
		if len(matches) == 0 {
			parts := append([]string{current}, segments[i:]...)
			return filepath.Join(parts...), nil
		}

		current = filepath.Join(current, matches[0])
	}

	return current, nil
}

// ValidateMediumPath normalizes a path inside a mounted medium and returns it
// slash separated and relative to the medium root ("/" means the root itself).
// It takes the same shape the web UI shows, so a leading slash is accepted and
// stripped.
func ValidateMediumPath(p string) (string, error) {
	if strings.ContainsRune(p, 0) {
		return "", fmt.Errorf("%w: contains NUL", ErrInvalidMediaPath)
	}

	p = strings.TrimPrefix(strings.TrimSpace(p), "/")
	if p == "" {
		return "/", nil
	}

	clean := path.Clean(p)
	if clean == "." {
		return "/", nil
	}
	if clean == ".." || strings.HasPrefix(clean, "../") {
		return "", fmt.Errorf("%w: %s escapes the medium", ErrInvalidMediaPath, p)
	}

	for _, segment := range strings.Split(clean, "/") {
		if err := validateName(segment); err != nil {
			return "", fmt.Errorf("%w: %s", ErrInvalidMediaPath, err)
		}
	}

	return clean, nil
}

// ValidateFileName checks a single file name for FAT/exFAT compatibility. It
// is what an upload's browser-supplied name has to pass before it is written
// into a medium.
func ValidateFileName(name string) error {
	return validateName(name)
}

func validateName(name string) error {
	if name == "" {
		return errors.New("empty name")
	}
	if name == "." || name == ".." {
		return fmt.Errorf("reserved name %q", name)
	}
	if utf8.RuneCountInString(name) > maxNameLength {
		return fmt.Errorf("name longer than %d characters", maxNameLength)
	}
	if strings.HasSuffix(name, ".") || strings.HasSuffix(name, " ") {
		return fmt.Errorf("name %q ends with a dot or space", name)
	}

	for _, r := range name {
		if r < 0x20 || r == 0x7f {
			return fmt.Errorf("name %q contains a control character", name)
		}
		if strings.ContainsRune(forbiddenNameChars, r) {
			return fmt.Errorf("name %q contains %q", name, r)
		}
	}

	base := name
	if i := strings.IndexByte(base, '.'); i >= 0 {
		base = base[:i]
	}
	if reservedNames[strings.ToUpper(base)] {
		return fmt.Errorf("name %q is reserved on Windows", name)
	}

	return nil
}

package utils

import (
	"errors"
	"path/filepath"
	"regexp"
	"strings"
)

// safeName matches names that are safe both as a path component and as an
// argument to a command: letters, digits, space, dot, dash and underscore
// only, and never starting with any of the last three. The character class
// holds no path separator, so a name that matches is always its own base name.
//
// A space is allowed because the name reaches the interpreter as one argument
// and never as shell text. Names such as "nightly backup.sh" are ordinary, and
// refusing them would also leave an existing one impossible to delete.
var safeName = regexp.MustCompile(`^[A-Za-z0-9_][A-Za-z0-9._ -]*$`)

var errUnsafeName = errors.New("unsafe file name")

// SecureJoin joins a caller-supplied file name onto a directory, rejecting
// anything that is not a plain name inside that directory.
func SecureJoin(dir string, name string) (string, error) {
	if !safeName.MatchString(name) {
		return "", errUnsafeName
	}

	return filepath.Join(dir, name), nil
}

// IsPathInside reports whether path is an absolute path to something strictly
// below dir, after resolving any "." and ".." segments. A relative path is
// refused outright, and a relative dir can never match one, so the answer is
// false unless the caller passes two absolute paths.
func IsPathInside(dir string, path string) bool {
	if !filepath.IsAbs(path) {
		return false
	}

	cleaned := filepath.Clean(path)
	prefix := filepath.Clean(dir) + string(filepath.Separator)

	return strings.HasPrefix(cleaned, prefix)
}

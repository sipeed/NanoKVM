// Package webcache labels the static files the server hands out.
//
// The frontend is one entry document plus content-hashed assets. The document
// is what an update replaces, and a browser that keeps it keeps the old app:
// the storage window of a release that updates but "looks unchanged" is that
// cache. Assets carry a hash in their name, so a name that is already cached
// can never change meaning.
package webcache

import (
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// Headers returns the middleware that sets Cache-Control for the web root.
// Paths it does not recognise are left alone.
func Headers(root string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Clean first: "/assets/../x" is not an asset, and it must not be
		// resolved outside root either.
		requestPath := path.Clean("/" + c.Request.URL.Path)

		switch {
		case requestPath == "/" || requestPath == "/index.html":
			c.Header("Cache-Control", "no-cache")
		case strings.HasPrefix(requestPath, "/assets/") && assetExists(root, requestPath):
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
		}
		c.Next()
	}
}

// assetExists reports whether the request names a file the build shipped. A
// missing hashed asset is answered with a 404, and marking that immutable would
// keep the URL broken in the browser for a year - which is exactly what a
// rollback to a build whose assets still exist would run into.
func assetExists(root, requestPath string) bool {
	relative := strings.TrimPrefix(requestPath, "/")
	info, err := os.Stat(filepath.Join(root, filepath.FromSlash(relative)))
	return err == nil && info.Mode().IsRegular()
}

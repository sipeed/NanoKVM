package webcache

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "assets"), 0o755); err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string]string{
		"index.html":              "x",
		"assets/index-abc123.js":  "x",
		"assets/style-abc123.css": "x",
	} {
		if err := os.WriteFile(filepath.Join(root, filepath.FromSlash(name)), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	tests := []struct {
		path string
		want string
	}{
		{"/", "no-cache"},
		{"/index.html", "no-cache"},
		{"/assets/index-abc123.js", "public, max-age=31536000, immutable"},
		{"/assets/style-abc123.css", "public, max-age=31536000, immutable"},
		// A missing asset is answered by a 404, and caching that for a year is
		// how a rollback to a build whose assets still exist stays broken.
		{"/assets/missing.js", ""},
		// Classified after cleaning, so a traversal never reaches the assets
		// branch or the filesystem.
		{"/assets/../index.html", "no-cache"},
		// Everything else keeps the server's default: the icon and the API
		// must not be pinned to a policy they were never reviewed for.
		{"/sipeed.ico", ""},
		{"/mockServiceWorker.js", ""},
		{"/api/auth/login", ""},
	}

	for _, tt := range tests {
		engine := gin.New()
		engine.Use(Headers(root))
		engine.NoRoute(func(c *gin.Context) { c.String(http.StatusNotFound, "") })

		request := httptest.NewRequest(http.MethodGet, tt.path, nil)
		recorder := httptest.NewRecorder()
		engine.ServeHTTP(recorder, request)

		if got := recorder.Header().Get("Cache-Control"); got != tt.want {
			t.Errorf("%s: Cache-Control = %q, want %q", tt.path, got, tt.want)
		}
	}
}

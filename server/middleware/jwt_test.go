package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func protectedEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/vm/system/reboot", CheckToken(), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})
	return r
}

func authenticatedRequest(t *testing.T, origin string) *httptest.ResponseRecorder {
	t.Helper()

	token, err := GenerateJWT("admin")
	if err != nil {
		t.Fatalf("failed to generate token: %s", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/vm/system/reboot", nil)
	req.Host = "nanokvm.local"
	req.AddCookie(&http.Cookie{Name: "nano-kvm-token", Value: token})
	if origin != "" {
		req.Header.Set("Origin", origin)
	}

	w := httptest.NewRecorder()
	protectedEngine().ServeHTTP(w, req)
	return w
}

func TestCheckTokenAcceptsValidTokenFromSameOrigin(t *testing.T) {
	w := authenticatedRequest(t, "https://nanokvm.local")

	if w.Code != http.StatusOK {
		t.Fatalf("same-origin request with a valid token should succeed, got %d", w.Code)
	}
}

func TestCheckTokenRejectsValidTokenFromForeignOrigin(t *testing.T) {
	// The cookie is valid; only the Origin differs. This is the CSRF /
	// cross-site websocket hijacking case.
	w := authenticatedRequest(t, "https://evil.example.com")

	if w.Code != http.StatusForbidden {
		t.Fatalf("cross-site request should be forbidden, got %d", w.Code)
	}
}

func TestCheckTokenAcceptsValidTokenWithoutOrigin(t *testing.T) {
	w := authenticatedRequest(t, "")

	if w.Code != http.StatusOK {
		t.Fatalf("non-browser request with a valid token should succeed, got %d", w.Code)
	}
}

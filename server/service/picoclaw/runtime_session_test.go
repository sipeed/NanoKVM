package picoclaw

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"NanoKVM-Server/service/controlmode"

	"github.com/gin-gonic/gin"
)

func TestReleaseRuntimeSessionAllowsMCPMode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	service := &Service{
		control: controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP),
	}
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodDelete, "/api/picoclaw/runtime/session", nil)
	c.Request.Header.Set(sessionIDHeader, "stale-session")

	service.ReleaseRuntimeSession(c)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if strings.Contains(recorder.Body.String(), CodeControlModeConflict) {
		t.Fatalf("body = %s, did not expect control conflict", recorder.Body.String())
	}
}

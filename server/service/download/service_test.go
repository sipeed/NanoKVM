package download

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestImageOperationsRefuseUnmountedDataDirectory(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldMounted := dataDirectoryMounted
	dataDirectoryMounted = func(string) bool { return false }
	t.Cleanup(func() { dataDirectoryMounted = oldMounted })

	t.Run("enabled", func(t *testing.T) {
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		NewService().ImageEnabled(context)

		if !strings.Contains(response.Body.String(), `"enabled":false`) {
			t.Fatalf("response = %s, want disabled", response.Body.String())
		}
	})

	t.Run("upload", func(t *testing.T) {
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		NewService().DownloadImageFile(context)

		if !strings.Contains(response.Body.String(), "data disk is not mounted") {
			t.Fatalf("response = %s, want data mount error", response.Body.String())
		}
	})

	t.Run("remote download", func(t *testing.T) {
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		context.Request = httptest.NewRequest("POST", "/download/image", strings.NewReader(`{"file":"https://example.com/test.iso"}`))
		context.Request.Header.Set("Content-Type", "application/json")
		NewService().DownloadImage(context)

		if !strings.Contains(response.Body.String(), "data disk is not mounted") {
			t.Fatalf("response = %s, want data mount error", response.Body.String())
		}
	})
}

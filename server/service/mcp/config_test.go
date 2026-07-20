package mcpservice

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"NanoKVM-Server/service/controlmode"

	"github.com/gin-gonic/gin"
)

func useTestConfig(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "mcp.json")
	oldPath := configFilePath
	configFilePath = path
	t.Cleanup(func() { configFilePath = oldPath })
	return path
}

func TestConfigLifecycle(t *testing.T) {
	path := useTestConfig(t)

	cfg, err := loadConfig()
	if err != nil || cfg.APIKey != "" {
		t.Fatalf("unexpected missing config result: cfg=%+v err=%v", cfg, err)
	}

	cfg, err = updateConfig(func(cfg Config) (Config, error) {
		cfg, err = ensureAPIKey(cfg)
		return cfg, err
	})
	if err != nil || !strings.HasPrefix(cfg.APIKey, apiKeyPrefix) {
		t.Fatalf("enable MCP: cfg=%+v err=%v", cfg, err)
	}
	firstKey := cfg.APIKey

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("stat config: %v", err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("config permissions = %o, want 600", info.Mode().Perm())
	}

	cfg, err = updateConfig(ensureAPIKey)
	if err != nil || cfg.APIKey != firstKey {
		t.Fatalf("ensure existing key changed it: cfg=%+v err=%v", cfg, err)
	}
	cfg, err = updateConfig(regenerateAPIKey)
	if err != nil || cfg.APIKey == firstKey {
		t.Fatalf("regenerate did not replace key: cfg=%+v err=%v", cfg, err)
	}
}

func TestLoadConfigRejectsCorruptJSON(t *testing.T) {
	path := useTestConfig(t)
	if err := os.WriteFile(path, []byte("{"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadConfig(); err == nil {
		t.Fatal("expected corrupt config error")
	}
}

func TestAPIKeyMiddleware(t *testing.T) {
	useTestConfig(t)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeOff)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/mcp", APIKeyMiddleware(control), func(c *gin.Context) { c.Status(http.StatusNoContent) })

	writeConfig := func(cfg Config) {
		if _, err := updateConfig(func(Config) (Config, error) { return cfg, nil }); err != nil {
			t.Fatal(err)
		}
	}
	request := func(header string) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/mcp", nil)
		if header != "" {
			req.Header.Set("Authorization", header)
		}
		router.ServeHTTP(recorder, req)
		return recorder
	}

	writeConfig(Config{APIKey: "secret"})
	if got := request("Bearer secret").Code; got != http.StatusForbidden {
		t.Fatalf("disabled status = %d", got)
	}
	if err := control.SwitchToMCP(nil); err != nil {
		t.Fatal(err)
	}
	for _, header := range []string{"", "secret", "Basic secret", "Bearer wrong"} {
		if got := request(header).Code; got != http.StatusUnauthorized {
			t.Fatalf("header %q status = %d", header, got)
		}
	}
	if got := request("Bearer secret").Code; got != http.StatusNoContent {
		t.Fatalf("valid key status = %d", got)
	}
	writeConfig(Config{APIKey: "rotated"})
	if got := request("Bearer secret").Code; got != http.StatusUnauthorized {
		t.Fatalf("old key after rotation status = %d", got)
	}
	if got := request("Bearer rotated").Code; got != http.StatusNoContent {
		t.Fatalf("rotated key status = %d", got)
	}
}

func TestSetConfigAPI(t *testing.T) {
	useTestConfig(t)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	preemptLeasesCalled := false
	stopRuntimeCalled := false
	releaseCalled := false
	gin.SetMode(gin.TestMode)
	service := NewServiceWithPreempt(control, func() error {
		preemptLeasesCalled = true
		return nil
	}, func() error {
		stopRuntimeCalled = true
		return nil
	}, func() error {
		releaseCalled = true
		return nil
	}, nil)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/mcp/config", strings.NewReader(`{"enabled":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	service.SetConfig(c)
	if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}

	var response struct {
		Code int `json:"code"`
		Data struct {
			Enabled     bool   `json:"enabled"`
			APIKey      string `json:"apiKey"`
			ControlMode string `json:"controlMode"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Code != 0 || !response.Data.Enabled || response.Data.APIKey == "" || response.Data.ControlMode != string(controlmode.ModeMCP) || !preemptLeasesCalled || !stopRuntimeCalled || !releaseCalled {
		t.Fatalf("unexpected response: %+v", response)
	}

	recorder = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/mcp/config", strings.NewReader(`{"enabled":false}`))
	c.Request.Header.Set("Content-Type", "application/json")
	service.SetConfig(c)
	if control.Current() != controlmode.ModeOff {
		t.Fatalf("mode after disabling MCP = %q, want off", control.Current())
	}
}

func TestSetConfigEnablePreemptFailureDoesNotEnableMCP(t *testing.T) {
	useTestConfig(t)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	wantErr := errors.New("picoclaw stop failed")
	service := NewServiceWithPreempt(control, func() error {
		return wantErr
	}, func() error {
		t.Fatal("runtime stop should not run when soft preempt fails")
		return nil
	}, func() error {
		t.Fatal("release should not run when preempt fails")
		return nil
	}, nil)

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/mcp/config", strings.NewReader(`{"enabled":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	service.SetConfig(c)

	if control.Current() != controlmode.ModePicoclaw {
		t.Fatalf("mode after failed preempt = %q, want picoclaw", control.Current())
	}
	var response struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Code != -2 || !strings.Contains(response.Msg, wantErr.Error()) {
		t.Fatalf("response = %+v, want preempt failure", response)
	}
}

func TestSetConfigEnableCleanupFailureFailsClosed(t *testing.T) {
	useTestConfig(t)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	wantErr := errors.New("picoclaw stop failed")
	preemptCalled := false
	releaseCalled := false
	service := NewServiceWithPreempt(control, func() error {
		preemptCalled = true
		return nil
	}, func() error {
		return wantErr
	}, func() error {
		releaseCalled = true
		return nil
	}, nil)

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/mcp/config", strings.NewReader(`{"enabled":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	service.SetConfig(c)

	if control.Current() != controlmode.ModeOff {
		t.Fatalf("mode after failed destructive cleanup = %q, want off", control.Current())
	}
	if !preemptCalled || !releaseCalled {
		t.Fatalf("preemptCalled=%v releaseCalled=%v, want both true", preemptCalled, releaseCalled)
	}
	var response struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Code != -2 || !strings.Contains(response.Msg, wantErr.Error()) {
		t.Fatalf("response = %+v, want cleanup failure", response)
	}
}

func TestSetConfigEnableReleaseFailureFailsClosed(t *testing.T) {
	useTestConfig(t)
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	service := NewService(control, func() error { return errors.New("release failed") })

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/mcp/config", strings.NewReader(`{"enabled":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	service.SetConfig(c)

	if control.Current() != controlmode.ModeOff {
		t.Fatalf("mode after failed enable = %q, want off", control.Current())
	}
	cfg, err := loadConfig()
	if err != nil || cfg.APIKey == "" {
		t.Fatalf("API key should be persisted before switching: cfg=%+v err=%v", cfg, err)
	}
}

package picoclaw

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"NanoKVM-Server/service/controlmode"

	"github.com/gin-gonic/gin"
)

func TestMCPBootstrapMethodsAllowedInAllControlModes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	for _, mode := range []controlmode.Mode{controlmode.ModeOff, controlmode.ModeMCP, controlmode.ModePicoclaw} {
		t.Run(string(mode), func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "mode")
			if err := os.WriteFile(path, []byte(string(mode)+"\n"), 0o600); err != nil {
				t.Fatal(err)
			}
			service := &Service{control: controlmode.NewManager(path, controlmode.ModePicoclaw)}

			for _, method := range []string{"initialize", "tools/list", "ping"} {
				response := performMCPRequest(service, jsonRPCBody(method))
				if response.Code != http.StatusOK {
					t.Fatalf("%s status = %d, body = %s", method, response.Code, response.Body.String())
				}
				if strings.Contains(response.Body.String(), `"error"`) {
					t.Fatalf("%s returned error: %s", method, response.Body.String())
				}
			}
		})
	}
}

func TestMCPBootstrapAllowedDuringControlTransition(t *testing.T) {
	gin.SetMode(gin.TestMode)
	manager := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeOff)
	service := &Service{control: manager}

	err := manager.Switch(controlmode.ModePicoclaw, func() error {
		response := performMCPRequest(service, jsonRPCBody("initialize"))
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
		}
		if strings.Contains(response.Body.String(), `"error"`) {
			t.Fatalf("bootstrap method returned error: %s", response.Body.String())
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestMCPActionsReturnStructuredControlErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)

	for _, test := range []struct {
		mode   controlmode.Mode
		reason string
	}{
		{mode: controlmode.ModeOff, reason: CodeControlRequired},
		{mode: controlmode.ModeMCP, reason: CodeControlOwnedByMCP},
	} {
		t.Run(string(test.mode), func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "mode")
			if err := os.WriteFile(path, []byte(string(test.mode)+"\n"), 0o600); err != nil {
				t.Fatal(err)
			}
			service := &Service{control: controlmode.NewManager(path, controlmode.ModePicoclaw)}
			response := performMCPRequest(
				service,
				`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kvm_actions","arguments":{"actions":[]}}}`,
			)
			body := response.Body.String()
			if response.Code != http.StatusOK {
				t.Fatalf("status = %d, body = %s", response.Code, body)
			}
			if !strings.Contains(body, `"code":-32003`) || !strings.Contains(body, `"reason":"`+test.reason+`"`) {
				t.Fatalf("body = %s, want structured %s error", body, test.reason)
			}
		})
	}
}

func TestMCPActionsRejectedDuringControlTransition(t *testing.T) {
	gin.SetMode(gin.TestMode)
	manager := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModePicoclaw)
	service := &Service{control: manager}

	err := manager.Switch(controlmode.ModeMCP, func() error {
		response := performMCPRequest(
			service,
			`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kvm_actions","arguments":{"actions":[]}}}`,
		)
		body := response.Body.String()
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, body = %s", response.Code, body)
		}
		if !strings.Contains(body, `"reason":"`+CodeControlTransitioning+`"`) {
			t.Fatalf("body = %s, want transitioning control error", body)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func performMCPRequest(service *Service, body string) *httptest.ResponseRecorder {
	router := gin.New()
	router.POST("/", service.MCPHandler)

	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func jsonRPCBody(method string) string {
	return `{"jsonrpc":"2.0","id":1,"method":"` + method + `"}`
}

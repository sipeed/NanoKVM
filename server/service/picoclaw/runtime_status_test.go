package picoclaw

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"NanoKVM-Server/service/controlmode"
)

func TestSyncRuntimeConfigMetadataFromPicoclawReadsPersistedModelWithoutMutation(t *testing.T) {
	home := t.TempDir()
	t.Setenv("PICOCLAW_HOME", home)

	configData := []byte(`{
  "agents": {
    "defaults": {
      "model_name": "test-model"
    }
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 18790
  },
  "model_list": [
    {
      "model_name": "test-model",
      "model": "provider/test-model",
      "api_base": "https://example.invalid"
    }
  ],
  "channel_list": {
    "pico": {
      "type": "pico",
      "enabled": false,
      "settings": {}
    }
  }
}`)
	configPath := filepath.Join(home, "config.json")
	if err := os.WriteFile(configPath, configData, 0o600); err != nil {
		t.Fatal(err)
	}
	securityData := []byte("model_list:\n  test-model:\n    api_keys:\n      - test-key\n")
	if err := os.WriteFile(filepath.Join(home, ".security.yml"), securityData, 0o600); err != nil {
		t.Fatal(err)
	}

	service := &Service{
		runtime: &RuntimeStore{status: RuntimeStatus{
			Status:    "model_not_configured",
			LastError: "stale model error",
		}},
	}
	if syncErr := service.syncRuntimeConfigMetadataFromPicoclaw(); syncErr != nil {
		t.Fatal(syncErr)
	}

	status := service.runtime.Get()
	if !status.ModelConfigured || status.ModelName != "test-model" {
		t.Fatalf("runtime model metadata = configured:%v name:%q", status.ModelConfigured, status.ModelName)
	}
	if status.CheckedAt.IsZero() {
		t.Fatal("runtime metadata refresh did not update checked_at")
	}
	if status.Status != "checking" || status.LastError != "" {
		t.Fatalf("runtime kept stale model status: %+v", status)
	}

	after, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(after, configData) {
		t.Fatalf("passive metadata refresh mutated config:\n%s", after)
	}

	for _, test := range []struct {
		mode       controlmode.Mode
		wantStatus string
	}{
		{mode: controlmode.ModeOff, wantStatus: "checking"},
		{mode: controlmode.ModeMCP, wantStatus: "checking"},
	} {
		rendered := applyControlModeStatus(status, controlmode.Status{Mode: test.mode})
		if !rendered.ModelConfigured || rendered.ModelName != "test-model" {
			t.Fatalf("mode %q lost model metadata: %+v", test.mode, rendered)
		}
		if rendered.Status != test.wantStatus {
			t.Fatalf("mode %q status = %q, want %q", test.mode, rendered.Status, test.wantStatus)
		}
		if rendered.Ready {
			t.Fatalf("mode %q unexpectedly changed ready to true", test.mode)
		}
		if rendered.Capabilities.DeviceWrite {
			t.Fatalf("mode %q allows PicoClaw device writes", test.mode)
		}
	}

	ready := status
	ready.Ready = true
	ready.Installed = true
	ready.Status = "ready"
	for _, test := range []struct {
		name              string
		status            controlmode.Status
		wantChat          bool
		wantReadOnlyTools bool
		wantDeviceWrite   bool
	}{
		{
			name:              "picoclaw",
			status:            controlmode.Status{Mode: controlmode.ModePicoclaw},
			wantChat:          true,
			wantReadOnlyTools: true,
			wantDeviceWrite:   true,
		},
		{name: "mcp", status: controlmode.Status{Mode: controlmode.ModeMCP}},
		{
			name:              "off",
			status:            controlmode.Status{Mode: controlmode.ModeOff},
			wantChat:          true,
			wantReadOnlyTools: true,
		},
		{
			name:   "transitioning",
			status: controlmode.Status{Mode: controlmode.ModePicoclaw, Transitioning: true},
		},
	} {
		rendered := applyControlModeStatus(ready, test.status)
		if !rendered.Ready || rendered.Status != "ready" {
			t.Fatalf("%s changed runtime readiness: %+v", test.name, rendered)
		}
		if rendered.Capabilities.Chat != test.wantChat ||
			rendered.Capabilities.ReadOnlyTools != test.wantReadOnlyTools ||
			rendered.Capabilities.DeviceWrite != test.wantDeviceWrite {
			t.Fatalf("%s capabilities = %+v, want chat=%v readOnlyTools=%v deviceWrite=%v",
				test.name,
				rendered.Capabilities,
				test.wantChat,
				test.wantReadOnlyTools,
				test.wantDeviceWrite,
			)
		}
	}
}

func TestSyncRuntimeConfigMetadataFromPicoclawTreatsMissingConfigAsUnconfigured(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())
	service := &Service{
		runtime: &RuntimeStore{status: RuntimeStatus{
			ModelConfigured: true,
			ModelName:       "stale-model",
			Status:          "config_error",
			ConfigError:     "stale config error",
			LastError:       "stale config error",
		}},
	}

	if syncErr := service.syncRuntimeConfigMetadataFromPicoclaw(); syncErr != nil {
		t.Fatal(syncErr)
	}
	status := service.runtime.Get()
	if status.ModelConfigured || status.ModelName != "" {
		t.Fatalf("missing config kept stale model metadata: %+v", status)
	}
	if status.Status == "config_error" || status.ConfigError != "" || status.LastError != "" {
		t.Fatalf("missing config reported a parse error: %+v", status)
	}
}

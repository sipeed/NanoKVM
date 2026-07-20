package picoclaw

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUpdatePicoclawModelConfigInitializesMissingConfig(t *testing.T) {
	home := t.TempDir()
	t.Setenv("PICOCLAW_HOME", home)

	previousOnboard := runPicoclawOnboardForConfig
	onboardCalled := false
	runPicoclawOnboardForConfig = func() (string, *PicoclawError) {
		onboardCalled = true
		configPath := filepath.Join(home, "config.json")
		err := os.WriteFile(configPath, []byte(`{
  "agents": {
    "defaults": {}
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 18790
  },
  "model_list": [],
  "channel_list": {}
}`), 0o600)
		if err != nil {
			return "", newPicoclawError(CodeRuntimeUnavailable, err.Error())
		}
		return "initialized", nil
	}
	t.Cleanup(func() {
		runPicoclawOnboardForConfig = previousOnboard
	})

	modelName, err := updatePicoclawModelConfig(
		"https://api.example.invalid",
		"secret-key",
		"openai/test-model",
	)
	if err != nil {
		t.Fatal(err)
	}
	if !onboardCalled {
		t.Fatal("missing config did not trigger PicoClaw onboard")
	}
	if modelName != "test-model" {
		t.Fatalf("model name = %q, want test-model", modelName)
	}

	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		t.Fatal(err)
	}
	if doc.config.Agents.Defaults.ModelName != "test-model" {
		t.Fatalf("default model = %q, want test-model", doc.config.Agents.Defaults.ModelName)
	}
	if version, ok := doc.raw["version"].(float64); !ok || int(version) != currentPicoclawConfigVersion {
		t.Fatalf("config version = %v, want %d", doc.raw["version"], currentPicoclawConfigVersion)
	}
	if !isPicoclawModelConfigured(doc.config, doc.security, "test-model") {
		t.Fatalf("model was not configured: config=%+v security=%+v", doc.config.ModelList, doc.security.ModelList)
	}
	if len(doc.config.ModelList) != 1 || doc.config.ModelList[0].APIKey != "" || len(doc.config.ModelList[0].APIKeys) != 0 {
		t.Fatalf("model API key leaked into config.json: %+v", doc.config.ModelList)
	}
}

func TestUpdatePicoclawModelConfigReportsOnboardFailure(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())

	previousOnboard := runPicoclawOnboardForConfig
	runPicoclawOnboardForConfig = func() (string, *PicoclawError) {
		return "", newPicoclawError(CodeRuntimeUnavailable, "onboard boom")
	}
	t.Cleanup(func() {
		runPicoclawOnboardForConfig = previousOnboard
	})

	_, err := updatePicoclawModelConfig("https://api.example.invalid", "secret-key", "openai/test-model")
	if err == nil {
		t.Fatal("expected onboard failure")
	}
	if !strings.Contains(err.Error(), "failed to initialize PicoClaw config before saving model config") {
		t.Fatalf("error = %v, want initialization context", err)
	}
}

func TestUpdatePicoclawModelConfigMigratesVersionAndKeepsUnknownFields(t *testing.T) {
	home := t.TempDir()
	t.Setenv("PICOCLAW_HOME", home)

	configPath := filepath.Join(home, "config.json")
	if err := os.WriteFile(configPath, []byte(`{
  "version": 4,
  "unknown_top_level": {
    "keep": true
  },
  "agents": {
    "defaults": {
      "model_name": "old-model"
    }
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 18790
  },
  "model_list": [
    {
      "model_name": "old-model",
      "model": "openai/old-model",
      "api_base": "https://api.example.invalid"
    }
  ],
  "channel_list": {}
}`), 0o600); err != nil {
		t.Fatal(err)
	}

	modelName, err := updatePicoclawModelConfig(
		"https://api.example.invalid",
		"secret-key",
		"openai/new-model",
	)
	if err != nil {
		t.Fatal(err)
	}
	if modelName != "new-model" {
		t.Fatalf("model name = %q, want new-model", modelName)
	}

	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		t.Fatal(err)
	}
	if version, ok := doc.raw["version"].(float64); !ok || int(version) != currentPicoclawConfigVersion {
		t.Fatalf("config version = %v, want %d", doc.raw["version"], currentPicoclawConfigVersion)
	}
	unknown, ok := doc.raw["unknown_top_level"].(map[string]any)
	if !ok || unknown["keep"] != true {
		t.Fatalf("unknown fields were not preserved: %#v", doc.raw["unknown_top_level"])
	}
}

func TestUpdatePicoclawModelConfigRejectsInvalidProvider(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())

	_, err := updatePicoclawModelConfig("https://api.example.invalid", "secret-key", "openao/deepseek-v4-flash")
	if err == nil {
		t.Fatal("expected invalid provider error")
	}
	if !strings.Contains(err.Error(), "did you mean openai") {
		t.Fatalf("error = %v, want provider hint", err)
	}
}

func TestUpdatePicoclawModelConfigRequiresProviderModelFormat(t *testing.T) {
	t.Setenv("PICOCLAW_HOME", t.TempDir())

	_, err := updatePicoclawModelConfig("https://api.example.invalid", "secret-key", "deepseek-v4-flash")
	if err == nil {
		t.Fatal("expected provider/model format error")
	}
	if !strings.Contains(err.Error(), "provider/model") {
		t.Fatalf("error = %v, want provider/model format hint", err)
	}
}

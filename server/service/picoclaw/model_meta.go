package picoclaw

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

// picoclawModelMetaFileName is a NanoKVM-owned sidecar next to the picoclaw
// config. It records only non-secret hints (which provider/auth method the user
// picked in the UI) so the status endpoint can render accurately. It never
// contains API keys or OAuth tokens. Setups configured before this file existed
// (e.g. the stock Gemini config) simply fall back to prefix inference.
const picoclawModelMetaFileName = ".nanokvm-model.json"

type picoclawModelMeta struct {
	Provider   string `json:"provider,omitempty"`
	AuthMethod string `json:"auth_method,omitempty"`
	ModelName  string `json:"model_name,omitempty"`
}

func resolvePicoclawModelMetaPath() (string, error) {
	configPath, err := resolvePicoclawConfigPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(filepath.Dir(configPath), picoclawModelMetaFileName), nil
}

func loadPicoclawModelMeta() picoclawModelMeta {
	path, err := resolvePicoclawModelMetaPath()
	if err != nil {
		return picoclawModelMeta{}
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return picoclawModelMeta{}
	}
	var meta picoclawModelMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return picoclawModelMeta{}
	}
	return meta
}

func savePicoclawModelMeta(meta picoclawModelMeta) error {
	path, err := resolvePicoclawModelMetaPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

// modelIdentifierForName returns the LiteLLM "<prefix>/<model>" identifier for a
// given model_name, or "" if not present in the model_list.
func modelIdentifierForName(cfg picoclawConfigFile, name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return ""
	}
	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) == name {
			return strings.TrimSpace(model.Model)
		}
	}
	return ""
}

// picoclawModelSummary holds everything the UI needs to render the current model
// configuration. No field is a secret: at most it reports whether a key exists.
type picoclawModelSummary struct {
	Provider           string
	ModelName          string
	ModelIdentifier    string
	APIBase            string
	AuthMethod         string
	ModelConfigured    bool
	APIKeyConfigured   bool
	EndpointConfigured bool
	OAuthAvailable     bool
	OAuthAuthenticated bool
}

// computePicoclawModelSummary derives the model summary from the live picoclaw
// config + security file + NanoKVM sidecar + OAuth capability. Safe to call when
// nothing is configured (returns a mostly-empty summary).
func computePicoclawModelSummary() picoclawModelSummary {
	summary := picoclawModelSummary{}
	summary.OAuthAvailable = picoclawOAuthCapability().Available

	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return summary
	}

	cfg := doc.config
	targetModelName := resolvePicoclawTargetModelName(cfg)
	summary.ModelName = targetModelName

	hasConfigKey := false
	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) != targetModelName {
			continue
		}
		summary.APIBase = strings.TrimSpace(model.APIBase)
		summary.ModelIdentifier = strings.TrimSpace(model.Model)
		if configHasModelAPIKeys(model.APIKey, model.APIKeys) {
			hasConfigKey = true
		}
		break
	}
	summary.EndpointConfigured = summary.APIBase != ""
	summary.APIKeyConfigured = hasConfigKey || securityHasModelAPIKeys(doc.security, targetModelName)

	meta := loadPicoclawModelMeta()
	if meta.Provider != "" && (meta.ModelName == "" || meta.ModelName == targetModelName) {
		summary.Provider = meta.Provider
	}
	if summary.Provider == "" {
		summary.Provider = inferProviderFromModel(summary.ModelIdentifier)
	}

	summary.OAuthAuthenticated = summary.OAuthAvailable && isProviderOAuthAuthenticated(summary.Provider)
	summary.AuthMethod = resolvePicoclawEffectiveAuthMethod(
		meta, targetModelName, summary.APIKeyConfigured, summary.OAuthAuthenticated,
	)
	summary.ModelConfigured = isPicoclawModelConfiguredWithAuth(
		cfg, doc.security, targetModelName, summary.AuthMethod, summary.OAuthAuthenticated,
	)

	return summary
}

// resolvePicoclawEffectiveAuthMethod derives the auth method used to decide
// model-configured-ness, identically for the status summary and the gateway
// readiness path so the two never disagree. It trusts the sidecar's auth method
// only when the sidecar applies to the current model, otherwise it infers one
// from which credential actually exists.
func resolvePicoclawEffectiveAuthMethod(
	meta picoclawModelMeta,
	targetModelName string,
	apiKeyConfigured bool,
	oauthAuthenticated bool,
) string {
	metaApplies := meta.Provider != "" && (meta.ModelName == "" || meta.ModelName == targetModelName)
	if metaApplies && meta.AuthMethod != "" {
		return meta.AuthMethod
	}
	switch {
	case apiKeyConfigured:
		return authMethodAPIKey
	case oauthAuthenticated:
		return authMethodOAuth
	default:
		return ""
	}
}

// isPicoclawModelConfiguredWithAuth extends the original api-key-only check to
// also treat no-auth (local) and OAuth-authenticated endpoints as configured,
// without changing behavior for existing api-key setups.
func isPicoclawModelConfiguredWithAuth(
	cfg picoclawConfigFile,
	security picoclawSecurityConfig,
	modelName string,
	authMethod string,
	oauthAuthenticated bool,
) bool {
	if modelName == "" {
		return false
	}
	if isPicoclawModelConfigured(cfg, security, modelName) {
		return true
	}

	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) != modelName {
			continue
		}
		if strings.TrimSpace(model.APIBase) == "" {
			return false
		}
		switch authMethod {
		case authMethodNone:
			return true
		case authMethodOAuth:
			return oauthAuthenticated
		}
		return false
	}
	return false
}

// withModelMeta enriches a RuntimeStatus with provider/auth/endpoint facts for
// the HTTP response. It never mutates persisted state and never exposes secrets.
func withModelMeta(status RuntimeStatus) RuntimeStatus {
	summary := computePicoclawModelSummary()
	status.Provider = summary.Provider
	status.AuthMethod = summary.AuthMethod
	status.OAuthAvailable = summary.OAuthAvailable
	status.OAuthAuthenticated = summary.OAuthAuthenticated
	status.APIKeyConfigured = summary.APIKeyConfigured
	status.EndpointConfigured = summary.EndpointConfigured
	if status.ModelName == "" {
		status.ModelName = summary.ModelName
	}
	return status
}

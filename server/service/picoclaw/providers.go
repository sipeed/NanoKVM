package picoclaw

import "strings"

// Authentication methods supported by the Configure Model UI.
const (
	authMethodAPIKey = "api_key"
	authMethodOAuth  = "oauth"
	authMethodNone   = "none"
)

// Provider identifiers exposed to the frontend. These are NanoKVM-side labels;
// the actual picoclaw config stores a LiteLLM-style "<prefix>/<model>" identifier
// plus an api_base, so the provider is otherwise only implicit in the prefix.
const (
	providerOpenAI           = "openai"
	providerAnthropic        = "anthropic"
	providerGoogle           = "google"
	providerOpenAICompatible = "openai_compatible"
	providerLocal            = "local"
	providerCustom           = "custom"
)

// apiTestStyle selects how the "Test Model" route shapes its minimal request.
const (
	testStyleOpenAI    = "openai"
	testStyleAnthropic = "anthropic"
	testStyleGemini    = "gemini"
)

// providerPreset is the maintainable, editable catalog entry for a provider.
//
// Model lists here are recommended *defaults*, not guarantees: the picoclaw
// binary and the upstream provider decide which model names are actually valid.
// The UI uses them to prefill a combo box that always allows a custom name.
type providerPreset struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	ModelPrefix      string   `json:"model_prefix"`
	DefaultAPIBase   string   `json:"default_api_base,omitempty"`
	EndpointRequired bool     `json:"endpoint_required"`
	EndpointEditable bool     `json:"endpoint_editable"`
	AuthMethods      []string `json:"auth_methods"`
	Models           []string `json:"models"`
	// Capabilities surfaced so the UI can warn before sending unsupported
	// builtin tool types (e.g. OpenAI Responses "web_search_preview").
	SupportsWebSearchPreview bool `json:"supports_web_search_preview"`
	// testStyle is server-internal only (never serialized).
	testStyle string
}

// picoclawProviderCatalog is the single source of truth for the Configure Model
// UI. Edit here to add providers or adjust default presets.
var picoclawProviderCatalog = []providerPreset{
	{
		ID:                       providerOpenAI,
		Name:                     "OpenAI / Codex",
		ModelPrefix:              "openai",
		DefaultAPIBase:           "https://api.openai.com/v1",
		EndpointRequired:         false,
		EndpointEditable:         true,
		AuthMethods:              []string{authMethodAPIKey, authMethodOAuth},
		Models:                   []string{"gpt-5-codex", "gpt-5.5", "gpt-5.3"},
		SupportsWebSearchPreview: true,
		testStyle:                testStyleOpenAI,
	},
	{
		ID:               providerAnthropic,
		Name:             "Anthropic / Claude",
		ModelPrefix:      "anthropic",
		DefaultAPIBase:   "https://api.anthropic.com",
		EndpointRequired: false,
		EndpointEditable: true,
		AuthMethods:      []string{authMethodAPIKey},
		Models:           []string{"claude-sonnet-4-6", "claude-opus-4-7"},
		testStyle:        testStyleAnthropic,
	},
	{
		ID:               providerGoogle,
		Name:             "Google Gemini",
		ModelPrefix:      "gemini",
		DefaultAPIBase:   "https://generativelanguage.googleapis.com/v1beta",
		EndpointRequired: false,
		EndpointEditable: true,
		AuthMethods:      []string{authMethodAPIKey},
		Models:           []string{"gemini-3.1-flash-lite", "gemini-3.1-pro"},
		testStyle:        testStyleGemini,
	},
	{
		ID:               providerOpenAICompatible,
		Name:             "OpenAI-compatible endpoint",
		ModelPrefix:      "openai",
		EndpointRequired: true,
		EndpointEditable: true,
		AuthMethods:      []string{authMethodAPIKey, authMethodNone},
		Models:           []string{},
		testStyle:        testStyleOpenAI,
	},
	{
		ID:               providerLocal,
		Name:             "Local (LM Studio / Ollama)",
		ModelPrefix:      "openai",
		DefaultAPIBase:   "http://localhost:1234/v1",
		EndpointRequired: true,
		EndpointEditable: true,
		AuthMethods:      []string{authMethodNone, authMethodAPIKey},
		Models:           []string{},
		testStyle:        testStyleOpenAI,
	},
	{
		ID:               providerCustom,
		Name:             "Custom / advanced",
		ModelPrefix:      "",
		EndpointRequired: true,
		EndpointEditable: true,
		AuthMethods:      []string{authMethodAPIKey, authMethodNone},
		Models:           []string{},
		testStyle:        testStyleOpenAI,
	},
}

func lookupProviderPreset(id string) (providerPreset, bool) {
	id = strings.TrimSpace(strings.ToLower(id))
	for _, preset := range picoclawProviderCatalog {
		if preset.ID == id {
			return preset, true
		}
	}
	return providerPreset{}, false
}

func providerAllowsAuthMethod(preset providerPreset, method string) bool {
	for _, allowed := range preset.AuthMethods {
		if allowed == method {
			return true
		}
	}
	return false
}

// inferProviderFromModel best-effort maps a stored LiteLLM "<prefix>/<model>"
// identifier back to a catalog provider. Used to keep already-configured setups
// (e.g. an existing "gemini/..." config with no NanoKVM sidecar) displaying
// correctly. When ambiguous (bare "openai/" can be OpenAI or a compatible
// endpoint) it returns the canonical cloud provider; the sidecar overrides this
// whenever the user saved through the new UI.
func inferProviderFromModel(model string) string {
	model = strings.TrimSpace(strings.ToLower(model))
	if model == "" {
		return ""
	}

	prefix := model
	if index := strings.Index(model, "/"); index >= 0 {
		prefix = model[:index]
	}

	switch prefix {
	case "gemini", "google", "vertex_ai", "vertex":
		return providerGoogle
	case "anthropic", "claude":
		return providerAnthropic
	case "openai", "azure", "azure_ai":
		return providerOpenAI
	case "ollama", "ollama_chat", "lm_studio", "lmstudio":
		return providerLocal
	default:
		return providerCustom
	}
}

// buildModelIdentifier composes the LiteLLM "<prefix>/<model>" identifier from a
// provider and a (possibly already-prefixed) bare model name. If the caller
// already supplied a prefix, it is respected.
func buildModelIdentifier(preset providerPreset, model string) string {
	model = strings.TrimSpace(model)
	if model == "" {
		return ""
	}
	if strings.Contains(model, "/") {
		return model
	}
	if preset.ModelPrefix == "" {
		return model
	}
	return preset.ModelPrefix + "/" + model
}

// Provider tool capabilities are surfaced to the UI via the SupportsWebSearchPreview
// field on each preset (serialized in GET /model/config). NanoKVM only ever injects
// standard MCP function tools (kvm_screenshot, kvm_actions), which every provider
// accepts; provider-specific builtin tools such as the OpenAI Responses
// "web_search_preview" are added by the picoclaw binary itself, so the capability
// flag is advisory context for the UI rather than a server-enforced filter.

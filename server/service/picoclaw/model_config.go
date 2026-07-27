package picoclaw

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
)

func extractPicoclawModelName(model string) string {
	model = strings.TrimSpace(model)
	if model == "" {
		return ""
	}

	if index := strings.LastIndex(model, "/"); index >= 0 && index < len(model)-1 {
		return strings.TrimSpace(model[index+1:])
	}

	return model
}

func isPicoclawModelConfigured(cfg picoclawConfigFile, security picoclawSecurityConfig, modelName string) bool {
	if modelName == "" {
		return false
	}

	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) != modelName {
			continue
		}
		if model.APIBase == "" {
			continue
		}
		if securityHasModelAPIKeys(security, modelName) {
			return true
		}
		return configHasModelAPIKeys(model.APIKey, model.APIKeys)
	}

	return false
}

func configHasModelAPIKeys(apiKey string, apiKeys []string) bool {
	return strings.TrimSpace(apiKey) != "" || len(apiKeys) > 0
}

func securityHasModelAPIKeys(security picoclawSecurityConfig, modelName string) bool {
	if modelName == "" || len(security.ModelList) == 0 {
		return false
	}

	if entry, ok := security.ModelList[modelName]; ok && len(entry.APIKeys) > 0 {
		return true
	}

	prefix := modelName + ":"
	for key, entry := range security.ModelList {
		if strings.HasPrefix(key, prefix) && len(entry.APIKeys) > 0 {
			return true
		}
	}

	return false
}

// ModelConfigResult is the redacted GET /model/config payload. It never returns
// the API key — only whether one exists.
type ModelConfigResult struct {
	Provider           string           `json:"provider"`
	ModelName          string           `json:"model_name"`
	ModelIdentifier    string           `json:"model_identifier"`
	APIBase            string           `json:"api_base"`
	AuthMethod         string           `json:"auth_method"`
	ModelConfigured    bool             `json:"model_configured"`
	APIKeyConfigured   bool             `json:"api_key_configured"`
	EndpointConfigured bool             `json:"endpoint_configured"`
	OAuthAvailable     bool             `json:"oauth_available"`
	OAuthAuthenticated bool             `json:"oauth_authenticated"`
	AgentProfile       string           `json:"agent_profile"`
	Providers          []providerPreset `json:"providers"`
}

func (s *Service) GetModelConfig(c *gin.Context) {
	summary := computePicoclawModelSummary()
	writeSuccess(c, ModelConfigResult{
		Provider:           summary.Provider,
		ModelName:          summary.ModelName,
		ModelIdentifier:    summary.ModelIdentifier,
		APIBase:            summary.APIBase,
		AuthMethod:         summary.AuthMethod,
		ModelConfigured:    summary.ModelConfigured,
		APIKeyConfigured:   summary.APIKeyConfigured,
		EndpointConfigured: summary.EndpointConfigured,
		OAuthAvailable:     summary.OAuthAvailable,
		OAuthAuthenticated: summary.OAuthAuthenticated,
		AgentProfile:       detectPicoclawAgentProfile(),
		Providers:          picoclawProviderCatalog,
	})
}

type ModelConfigUpdateRequest struct {
	Provider   string `json:"provider"`
	Model      string `json:"model"`
	APIBase    string `json:"api_base"`
	APIKey     string `json:"api_key"`
	AuthMethod string `json:"auth_method"`
}

func (s *Service) UpdateModelConfig(c *gin.Context) {
	var req ModelConfigUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid model config payload"))
		return
	}

	currentStatus := s.runtime.Get()
	shouldRestart := currentStatus.Ready || currentStatus.Status == "ready"

	modelName, saveErr := s.saveModelConfig(req)
	if saveErr != nil {
		writePicoclawError(c, saveErr)
		return
	}
	if err := ensurePicoclawStartupDefaults(); err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "model config saved, but failed to persist picoclaw defaults: "+err.Error()))
		return
	}

	if shouldRestart {
		if _, _, stopErr := s.stopRuntime(); stopErr != nil {
			writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "model config saved, but failed to restart picoclaw runtime: "+stopErr.Message))
			return
		}
		if _, _, startErr := s.startRuntime(); startErr != nil {
			writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "model config saved, but failed to restart picoclaw runtime: "+startErr.Message))
			return
		}
	} else {
		_ = s.syncConfigFromPicoclaw()
		_ = s.ensureRuntimeReady()
	}

	writeSuccess(c, gin.H{
		"model_name": modelName,
		"status":     withModelMeta(withAgentProfile(s.runtime.Get())),
	})
}

// saveModelConfig validates the provider/auth/model/endpoint combination and
// persists it. API keys go only to .security.yml; OAuth/no-auth never write a
// key. A non-secret sidecar records the chosen provider + auth method.
func (s *Service) saveModelConfig(req ModelConfigUpdateRequest) (string, *PicoclawError) {
	model := strings.TrimSpace(req.Model)
	if model == "" {
		return "", newPicoclawError(CodeInvalidAction, "model identifier is required")
	}

	providerID := strings.TrimSpace(strings.ToLower(req.Provider))
	if providerID == "" {
		providerID = inferProviderFromModel(model)
	}
	preset, ok := lookupProviderPreset(providerID)
	if !ok {
		return "", newPicoclawError(CodeInvalidAction, "unsupported provider: "+providerID)
	}

	authMethod := strings.TrimSpace(strings.ToLower(req.AuthMethod))
	if authMethod == "" {
		authMethod = authMethodAPIKey
	}
	if !providerAllowsAuthMethod(preset, authMethod) {
		return "", newPicoclawError(CodeInvalidAction, fmt.Sprintf("provider %s does not support auth method %s", providerID, authMethod))
	}

	fullModel := buildModelIdentifier(preset, model)
	modelName := extractPicoclawModelName(fullModel)
	if modelName == "" {
		return "", newPicoclawError(CodeInvalidAction, "model identifier is required")
	}

	apiBase := strings.TrimSpace(req.APIBase)
	if apiBase == "" {
		apiBase = preset.DefaultAPIBase
	}
	if apiBase == "" {
		return "", newPicoclawError(CodeInvalidAction, "API base URL is required for provider "+providerID)
	}

	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return "", newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}
	hasExistingKey := modelHasStoredKey(doc.config, doc.security, modelName)

	apiKey := strings.TrimSpace(req.APIKey)
	var keyAction modelKeyAction
	switch authMethod {
	case authMethodAPIKey:
		switch {
		case apiKey != "":
			keyAction = keyActionSet
		case hasExistingKey:
			keyAction = keyActionKeep
		default:
			return "", newPicoclawError(CodeInvalidAction, "API key is required for API key authentication")
		}
	case authMethodOAuth:
		capability := picoclawOAuthCapability()
		if !capability.Available {
			return "", newPicoclawError(CodeOAuthUnavailable, "OAuth is not available: "+capability.Reason)
		}
		if !isProviderOAuthAuthenticated(providerID) {
			return "", newPicoclawError(CodeAuthFailed, "sign in with OAuth before saving (no authenticated session for "+providerID+")")
		}
		keyAction = keyActionClear
	case authMethodNone:
		keyAction = keyActionClear
	default:
		return "", newPicoclawError(CodeInvalidAction, "unsupported auth method: "+authMethod)
	}

	savedName, applyErr := applyPicoclawModelConfig(providerID, authMethod, fullModel, modelName, apiBase, apiKey, keyAction)
	if applyErr != nil {
		return "", newPicoclawError(CodeRuntimeUnavailable, applyErr.Error())
	}
	return savedName, nil
}

type modelKeyAction int

const (
	keyActionKeep modelKeyAction = iota
	keyActionSet
	keyActionClear
)

// deleteModelSecurityKeys removes every .security.yml model_list entry that the
// readers (securityHasModelAPIKeys / resolveModelAPIKey) would treat as a key for
// modelName — the bare name and any "<modelName>:<index>" form. Returns whether
// anything was removed.
func deleteModelSecurityKeys(security *picoclawSecurityConfig, modelName string) bool {
	if security.ModelList == nil {
		return false
	}
	prefix := modelName + ":"
	changed := false
	for key := range security.ModelList {
		if key == modelName || strings.HasPrefix(key, prefix) {
			delete(security.ModelList, key)
			changed = true
		}
	}
	return changed
}

func modelHasStoredKey(cfg picoclawConfigFile, security picoclawSecurityConfig, modelName string) bool {
	if securityHasModelAPIKeys(security, modelName) {
		return true
	}
	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) == modelName && configHasModelAPIKeys(model.APIKey, model.APIKeys) {
			return true
		}
	}
	return false
}

func applyPicoclawModelConfig(provider, authMethod, model, modelName, apiBase, apiKey string, keyAction modelKeyAction) (string, error) {
	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return "", err
	}

	modelListValue, ok := doc.raw["model_list"].([]any)
	if !ok {
		modelListValue = []any{}
	}

	modelUpdated := false
	updatedModelIndex := -1
	for index, item := range modelListValue {
		modelMap, ok := item.(map[string]any)
		if !ok {
			continue
		}
		currentModelName := strings.TrimSpace(fmt.Sprintf("%v", modelMap["model_name"]))
		if currentModelName != modelName {
			continue
		}
		modelMap["model_name"] = modelName
		modelMap["model"] = model
		modelMap["api_base"] = apiBase
		// API keys never live in config.json; they belong in .security.yml.
		delete(modelMap, "api_key")
		delete(modelMap, "api_keys")
		modelUpdated = true
		updatedModelIndex = index
		break
	}
	if !modelUpdated {
		modelListValue = append(modelListValue, map[string]any{
			"model_name": modelName,
			"model":      model,
			"api_base":   apiBase,
		})
		doc.raw["model_list"] = modelListValue
		updatedModelIndex = len(modelListValue) - 1
	}

	agents, ok := doc.raw["agents"].(map[string]any)
	if !ok {
		agents = map[string]any{}
		doc.raw["agents"] = agents
	}
	defaults, ok := agents["defaults"].(map[string]any)
	if !ok {
		defaults = map[string]any{}
		agents["defaults"] = defaults
	}
	defaults["model_name"] = modelName
	delete(defaults, "model")

	if err := doc.saveConfig(); err != nil {
		return "", err
	}

	securityModelName := indexedModelName(modelListValue, updatedModelIndex, modelName)
	switch keyAction {
	case keyActionSet:
		if doc.security.ModelList == nil {
			doc.security.ModelList = map[string]picoclawModelSecurityEntry{}
		}
		// Drop any stale entries (bare or other indices) so exactly one canonical
		// key remains and cannot be shadowed at read time.
		deleteModelSecurityKeys(&doc.security, modelName)
		doc.security.ModelList[securityModelName] = picoclawModelSecurityEntry{
			APIKeys: []string{apiKey},
		}
		if err := doc.saveSecurity(); err != nil {
			return "", err
		}
	case keyActionClear:
		// Remove every key the readers would treat as live for this model.
		if deleteModelSecurityKeys(&doc.security, modelName) {
			if err := doc.saveSecurity(); err != nil {
				return "", err
			}
		}
	case keyActionKeep:
		// Leave the existing stored key untouched.
	}

	if err := savePicoclawModelMeta(picoclawModelMeta{
		Provider:   provider,
		AuthMethod: authMethod,
		ModelName:  modelName,
	}); err != nil {
		return "", err
	}

	return modelName, nil
}

func indexedModelName(modelList []any, targetIndex int, modelName string) string {
	if targetIndex < 0 {
		return modelName
	}

	currentIndex := 0
	for index, item := range modelList {
		modelMap, ok := item.(map[string]any)
		if !ok {
			continue
		}
		currentModelName := strings.TrimSpace(fmt.Sprintf("%v", modelMap["model_name"]))
		if currentModelName != modelName {
			continue
		}
		if index == targetIndex {
			return fmt.Sprintf("%s:%d", modelName, currentIndex)
		}
		currentIndex++
	}

	return modelName
}

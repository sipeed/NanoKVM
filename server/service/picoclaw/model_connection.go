package picoclaw

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// The Configure Model "Test Model" button runs a minimal prompt directly against
// the configured provider so the result can be classified precisely (auth vs.
// model vs. endpoint vs. network). Secrets never appear in the response: at most
// a coarse outcome, a friendly message, the model's short reply, and a server
// log reference. Full provider responses are only logged server-side (redacted).

const (
	modelTestPrompt  = "Reply with exactly OK"
	modelTestTimeout = 25 * time.Second
)

// Test outcomes (kept stable for the frontend i18n mapping).
const (
	testOutcomeSuccess         = "success"
	testOutcomeAuthError       = "auth_error"
	testOutcomeInvalidModel    = "invalid_model"
	testOutcomeInvalidEndpoint = "invalid_endpoint"
	testOutcomeNetworkError    = "network_error"
	testOutcomeParserError     = "parser_error"
	testOutcomeUnsupported     = "unsupported"
	testOutcomeNotConfigured   = "not_configured"
	testOutcomeNotTestable     = "oauth_not_testable"
	testOutcomeUnknown         = "unknown"
)

type ModelTestRequest struct {
	Provider   string `json:"provider"`
	Model      string `json:"model"`
	APIBase    string `json:"api_base"`
	APIKey     string `json:"api_key"`
	AuthMethod string `json:"auth_method"`
}

type ModelTestResult struct {
	Ok         bool   `json:"ok"`
	Outcome    string `json:"outcome"`
	Reply      string `json:"reply,omitempty"`
	StatusCode int    `json:"status_code,omitempty"`
	LogRef     string `json:"log_ref,omitempty"`
}

func newLogRef() string {
	buf := make([]byte, 4)
	if _, err := rand.Read(buf); err != nil {
		return "0000"
	}
	return hex.EncodeToString(buf)
}

func (s *Service) TestModel(c *gin.Context) {
	var req ModelTestRequest
	_ = c.ShouldBindJSON(&req) // body is optional; falls back to saved config

	logRef := newLogRef()
	summary := computePicoclawModelSummary()

	providerID := firstNonEmpty(strings.ToLower(strings.TrimSpace(req.Provider)), summary.Provider)
	if providerID == "" {
		providerID = providerOpenAICompatible
	}
	preset, ok := lookupProviderPreset(providerID)
	if !ok {
		writeSuccess(c, ModelTestResult{Outcome: testOutcomeUnknown, LogRef: logRef})
		return
	}

	authMethod := firstNonEmpty(strings.ToLower(strings.TrimSpace(req.AuthMethod)), summary.AuthMethod)

	// Resolve the bare model name to send to the provider.
	requestedModel := strings.TrimSpace(req.Model)
	var modelName string
	if requestedModel != "" {
		modelName = extractPicoclawModelName(buildModelIdentifier(preset, requestedModel))
	} else {
		modelName = summary.ModelName
	}
	if modelName == "" {
		writeSuccess(c, ModelTestResult{Outcome: testOutcomeNotConfigured, LogRef: logRef})
		return
	}

	apiBase := firstNonEmpty(strings.TrimSpace(req.APIBase), summary.APIBase, preset.DefaultAPIBase)
	if apiBase == "" {
		writeSuccess(c, ModelTestResult{Outcome: testOutcomeInvalidEndpoint, LogRef: logRef})
		return
	}

	// OAuth credentials live inside the picoclaw binary; we cannot replay them
	// from here, so a direct test is not possible for OAuth setups. Report a
	// distinct outcome so the UI explains this honestly rather than implying the
	// provider rejected an unsupported tool.
	if authMethod == authMethodOAuth {
		writeSuccess(c, ModelTestResult{Outcome: testOutcomeNotTestable, LogRef: logRef})
		return
	}

	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" && authMethod != authMethodNone {
		if doc, err := loadPicoclawConfigDocument(); err == nil {
			apiKey = resolveModelAPIKey(doc.config, doc.security, modelName)
		}
	}
	if apiKey == "" && authMethod == authMethodAPIKey {
		writeSuccess(c, ModelTestResult{Outcome: testOutcomeAuthError, LogRef: logRef})
		return
	}

	result := runModelTest(preset.testStyle, apiBase, modelName, apiKey)
	result.LogRef = logRef

	// Server-side log only — no key, no raw body.
	log.Warnf("[picoclaw model-test %s] provider=%s model=%s style=%s outcome=%s status=%d",
		logRef, providerID, modelName, preset.testStyle, result.Outcome, result.StatusCode)

	writeSuccess(c, result)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func resolveModelAPIKey(cfg picoclawConfigFile, security picoclawSecurityConfig, modelName string) string {
	if security.ModelList != nil {
		if entry, ok := security.ModelList[modelName]; ok && len(entry.APIKeys) > 0 {
			return entry.APIKeys[0]
		}
		prefix := modelName + ":"
		for key, entry := range security.ModelList {
			if strings.HasPrefix(key, prefix) && len(entry.APIKeys) > 0 {
				return entry.APIKeys[0]
			}
		}
	}
	for _, model := range cfg.ModelList {
		if strings.TrimSpace(model.ModelName) != modelName {
			continue
		}
		if strings.TrimSpace(model.APIKey) != "" {
			return model.APIKey
		}
		if len(model.APIKeys) > 0 {
			return model.APIKeys[0]
		}
	}
	return ""
}

func runModelTest(style, apiBase, modelName, apiKey string) ModelTestResult {
	endpoint, body, headers, err := buildModelTestRequest(style, apiBase, modelName, apiKey)
	if err != nil {
		return ModelTestResult{Outcome: testOutcomeInvalidEndpoint}
	}

	ctx, cancel := context.WithTimeout(context.Background(), modelTestTimeout)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return ModelTestResult{Outcome: testOutcomeInvalidEndpoint}
	}
	httpReq.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		httpReq.Header.Set(key, value)
	}

	client := &http.Client{Timeout: modelTestTimeout}
	resp, err := client.Do(httpReq)
	if err != nil {
		return ModelTestResult{Outcome: classifyTransportError(err)}
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	return classifyModelTestResponse(style, resp.StatusCode, respBody)
}

func buildModelTestRequest(style, apiBase, modelName, apiKey string) (string, []byte, map[string]string, error) {
	base := strings.TrimRight(strings.TrimSpace(apiBase), "/")
	if base == "" {
		return "", nil, nil, fmt.Errorf("empty api base")
	}
	if parsed, err := url.Parse(base); err != nil || parsed.Host == "" {
		return "", nil, nil, fmt.Errorf("invalid api base")
	}

	headers := map[string]string{}

	switch style {
	case testStyleAnthropic:
		headers["x-api-key"] = apiKey
		headers["anthropic-version"] = "2023-06-01"
		payload := map[string]any{
			"model":      modelName,
			"max_tokens": 16,
			"messages": []map[string]any{
				{"role": "user", "content": modelTestPrompt},
			},
		}
		body, _ := json.Marshal(payload)
		return base + "/v1/messages", body, headers, nil

	case testStyleGemini:
		payload := map[string]any{
			"contents": []map[string]any{
				{"parts": []map[string]any{{"text": modelTestPrompt}}},
			},
			"generationConfig": map[string]any{"maxOutputTokens": 16},
		}
		body, _ := json.Marshal(payload)
		endpoint := fmt.Sprintf("%s/models/%s:generateContent", base, url.PathEscape(modelName))
		if apiKey != "" {
			endpoint += "?key=" + url.QueryEscape(apiKey)
		}
		return endpoint, body, headers, nil

	default: // testStyleOpenAI and OpenAI-compatible
		if apiKey != "" {
			headers["Authorization"] = "Bearer " + apiKey
		}
		payload := map[string]any{
			"model":       modelName,
			"max_tokens":  16,
			"temperature": 0,
			"messages": []map[string]any{
				{"role": "user", "content": modelTestPrompt},
			},
		}
		body, _ := json.Marshal(payload)
		return base + "/chat/completions", body, headers, nil
	}
}

func classifyTransportError(err error) string {
	message := strings.ToLower(err.Error())
	switch {
	case strings.Contains(message, "no such host"),
		strings.Contains(message, "server misbehaving"),
		strings.Contains(message, "unsupported protocol"),
		strings.Contains(message, "invalid"):
		return testOutcomeInvalidEndpoint
	default:
		return testOutcomeNetworkError
	}
}

func classifyModelTestResponse(style string, statusCode int, body []byte) ModelTestResult {
	lowerBody := strings.ToLower(string(body))

	switch {
	case statusCode == http.StatusUnauthorized, statusCode == http.StatusForbidden:
		return ModelTestResult{Outcome: testOutcomeAuthError, StatusCode: statusCode}
	case statusCode == http.StatusNotFound:
		if strings.Contains(lowerBody, "model") {
			return ModelTestResult{Outcome: testOutcomeInvalidModel, StatusCode: statusCode}
		}
		return ModelTestResult{Outcome: testOutcomeInvalidEndpoint, StatusCode: statusCode}
	case statusCode == http.StatusBadRequest:
		switch {
		case strings.Contains(lowerBody, "web_search_preview"),
			strings.Contains(lowerBody, "unsupported tool"),
			strings.Contains(lowerBody, "not supported"):
			return ModelTestResult{Outcome: testOutcomeUnsupported, StatusCode: statusCode}
		case strings.Contains(lowerBody, "model"),
			strings.Contains(lowerBody, "does not exist"),
			strings.Contains(lowerBody, "not found"):
			return ModelTestResult{Outcome: testOutcomeInvalidModel, StatusCode: statusCode}
		default:
			return ModelTestResult{Outcome: testOutcomeUnknown, StatusCode: statusCode}
		}
	case statusCode >= 200 && statusCode < 300:
		reply, ok := extractModelTestReply(style, body)
		if !ok {
			return ModelTestResult{Outcome: testOutcomeParserError, StatusCode: statusCode}
		}
		return ModelTestResult{Ok: true, Outcome: testOutcomeSuccess, Reply: reply, StatusCode: statusCode}
	case statusCode == http.StatusTooManyRequests:
		return ModelTestResult{Outcome: testOutcomeAuthError, StatusCode: statusCode}
	default:
		return ModelTestResult{Outcome: testOutcomeUnknown, StatusCode: statusCode}
	}
}

// extractModelTestReply pulls the short assistant text from a provider response.
// Returns ok=false when the shape is unrecognizable (a streaming/parser issue).
func extractModelTestReply(style string, body []byte) (string, bool) {
	switch style {
	case testStyleAnthropic:
		var parsed struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		}
		if err := json.Unmarshal(body, &parsed); err != nil || len(parsed.Content) == 0 {
			return "", false
		}
		return truncateReply(strings.TrimSpace(parsed.Content[0].Text)), true

	case testStyleGemini:
		var parsed struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}
		if err := json.Unmarshal(body, &parsed); err != nil ||
			len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
			return "", false
		}
		return truncateReply(strings.TrimSpace(parsed.Candidates[0].Content.Parts[0].Text)), true

	default:
		var parsed struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(body, &parsed); err != nil || len(parsed.Choices) == 0 {
			return "", false
		}
		return truncateReply(strings.TrimSpace(parsed.Choices[0].Message.Content)), true
	}
}

func truncateReply(reply string) string {
	const maxLen = 120
	if len(reply) > maxLen {
		return reply[:maxLen]
	}
	return reply
}

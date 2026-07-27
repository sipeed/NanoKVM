package picoclaw

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// OAuth in NanoKVM is delegated entirely to the installed picoclaw binary: this
// server never handles ChatGPT cookies, browser session tokens, or raw access/
// refresh tokens. It only orchestrates the binary's own auth subcommand (when it
// exposes one) and records a non-secret "authenticated" hint so the UI can show
// status. If the binary has no auth command, every route below reports a clear
// "unavailable" with the exact command we looked for.

const (
	picoclawOAuthMetaFileName = ".nanokvm-oauth.json"
	picoclawAuthProbeTimeout  = 4 * time.Second
	picoclawOAuthCapTTL       = 60 * time.Second
)

type picoclawOAuthCapabilityResult struct {
	Available bool
	Command   string
	Reason    string
}

var (
	oauthCapMu        sync.Mutex
	oauthCapCached    picoclawOAuthCapabilityResult
	oauthCapCheckedAt time.Time
	oauthCapProbing   bool
)

// picoclawOAuthCapability reports whether the installed picoclaw binary exposes
// an OAuth login command. The result is cached briefly to keep status polling
// cheap. The binary probe runs WITHOUT holding the mutex, and only one probe runs
// at a time, so a slow/hung binary never serializes unrelated status requests —
// concurrent callers get the last cached value while a single probe refreshes.
func picoclawOAuthCapability() picoclawOAuthCapabilityResult {
	oauthCapMu.Lock()
	fresh := !oauthCapCheckedAt.IsZero() && time.Since(oauthCapCheckedAt) < picoclawOAuthCapTTL
	if fresh || oauthCapProbing {
		cached := oauthCapCached
		oauthCapMu.Unlock()
		return cached
	}
	oauthCapProbing = true
	oauthCapMu.Unlock()

	result := detectPicoclawOAuthCapability()

	oauthCapMu.Lock()
	oauthCapCached = result
	oauthCapCheckedAt = time.Now()
	oauthCapProbing = false
	oauthCapMu.Unlock()
	return result
}

func detectPicoclawOAuthCapability() picoclawOAuthCapabilityResult {
	installed, err := isPicoclawInstalled()
	if err != nil || !installed {
		return picoclawOAuthCapabilityResult{
			Available: false,
			Reason:    "picoclaw is not installed",
		}
	}

	// Probe the binary for an "auth" subcommand. A zero exit on `auth --help`
	// means the subcommand is recognized; we then require it to advertise a
	// login/oauth flow before declaring OAuth available. We never guess at flags
	// beyond --help, so a missing or unrecognized command reports unavailable
	// rather than risking a wrong call.
	output, runErr := runPicoclawBinary(picoclawAuthProbeTimeout, "auth", "--help")
	if runErr != nil {
		return picoclawOAuthCapabilityResult{
			Available: false,
			Reason:    "the installed picoclaw binary does not expose an `auth` subcommand (looked for `picoclaw auth login`)",
		}
	}

	combined := strings.ToLower(output)
	if strings.Contains(combined, "login") || strings.Contains(combined, "oauth") {
		return picoclawOAuthCapabilityResult{Available: true, Command: "picoclaw auth login"}
	}

	return picoclawOAuthCapabilityResult{
		Available: false,
		Reason:    "the installed picoclaw `auth` command does not advertise a login/oauth flow",
	}
}

func runPicoclawBinary(timeout time.Duration, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, picoclawBinaryPath, args...)
	output, err := cmd.CombinedOutput()
	return strings.TrimSpace(string(output)), err
}

// --- Non-secret OAuth state store -------------------------------------------

type picoclawOAuthState struct {
	Providers map[string]picoclawOAuthProviderState `json:"providers,omitempty"`
}

type picoclawOAuthProviderState struct {
	Authenticated bool   `json:"authenticated"`
	Account       string `json:"account,omitempty"`
	ExpiresAt     string `json:"expires_at,omitempty"`
}

func resolvePicoclawOAuthMetaPath() (string, error) {
	configPath, err := resolvePicoclawConfigPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(filepath.Dir(configPath), picoclawOAuthMetaFileName), nil
}

func loadPicoclawOAuthState() picoclawOAuthState {
	path, err := resolvePicoclawOAuthMetaPath()
	if err != nil {
		return picoclawOAuthState{}
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return picoclawOAuthState{}
	}
	var state picoclawOAuthState
	if err := json.Unmarshal(data, &state); err != nil {
		return picoclawOAuthState{}
	}
	return state
}

func savePicoclawOAuthState(state picoclawOAuthState) error {
	path, err := resolvePicoclawOAuthMetaPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

func setProviderOAuthState(provider string, state picoclawOAuthProviderState) error {
	all := loadPicoclawOAuthState()
	if all.Providers == nil {
		all.Providers = map[string]picoclawOAuthProviderState{}
	}
	all.Providers[provider] = state
	return savePicoclawOAuthState(all)
}

func clearProviderOAuthState(provider string) error {
	all := loadPicoclawOAuthState()
	if all.Providers == nil {
		return nil
	}
	delete(all.Providers, provider)
	return savePicoclawOAuthState(all)
}

func isProviderOAuthAuthenticated(provider string) bool {
	if provider == "" {
		return false
	}
	state := loadPicoclawOAuthState()
	entry, ok := state.Providers[provider]
	if !ok || !entry.Authenticated {
		return false
	}
	if entry.ExpiresAt != "" {
		if expires, err := time.Parse(time.RFC3339, entry.ExpiresAt); err == nil && time.Now().After(expires) {
			return false
		}
	}
	return true
}

// --- HTTP handlers -----------------------------------------------------------

type AuthStatusResult struct {
	Provider          string `json:"provider"`
	Available         bool   `json:"available"`
	Authenticated     bool   `json:"authenticated"`
	Status            string `json:"status,omitempty"`
	LoginURL          string `json:"login_url,omitempty"`
	UserCode          string `json:"user_code,omitempty"`
	Account           string `json:"account,omitempty"`
	ExpiresAt         string `json:"expires_at,omitempty"`
	Error             string `json:"error,omitempty"`
	UnavailableReason string `json:"unavailable_reason,omitempty"`
	MissingCommand    string `json:"missing_command,omitempty"`
}

func deviceCodeMissingCommand(provider string) string {
	return "picoclaw auth login --provider " + provider + " --device-code"
}

// mergeLiveLoginState overlays any in-flight/recent device-code login for the
// provider onto a status result so the UI can poll for progress.
func mergeLiveLoginState(result *AuthStatusResult, provider string) {
	login := oauthLoginMgr.snapshot()
	if login.Provider != provider || login.Status == "" || login.Status == loginStatusIdle {
		return
	}
	result.Status = login.Status
	result.LoginURL = login.LoginURL
	result.UserCode = login.UserCode
	if login.Account != "" && result.Account == "" {
		result.Account = login.Account
	}
	if login.Status == loginStatusFailed {
		result.Error = login.Error
	}
	if login.Status == loginStatusAuthenticated {
		result.Authenticated = true
	}
}

func normalizeOAuthProvider(provider string) (string, *PicoclawError) {
	provider = strings.TrimSpace(strings.ToLower(provider))
	if provider == "" {
		provider = providerOpenAI
	}
	preset, ok := lookupProviderPreset(provider)
	if !ok {
		return "", newPicoclawError(CodeInvalidAction, "unknown provider: "+provider)
	}
	if !providerAllowsAuthMethod(preset, authMethodOAuth) {
		return "", newPicoclawError(CodeInvalidAction, "provider does not support OAuth: "+provider)
	}
	return provider, nil
}

func (s *Service) GetAuthStatus(c *gin.Context) {
	provider, perr := normalizeOAuthProvider(c.Query("provider"))
	if perr != nil {
		writePicoclawError(c, perr)
		return
	}

	capability := picoclawOAuthCapability()
	result := AuthStatusResult{
		Provider:  provider,
		Available: capability.Available,
	}
	if !capability.Available {
		result.UnavailableReason = capability.Reason
		result.MissingCommand = deviceCodeMissingCommand(provider)
		writeSuccess(c, result)
		return
	}

	result.Authenticated = isProviderOAuthAuthenticated(provider)
	if entry, ok := loadPicoclawOAuthState().Providers[provider]; ok {
		result.Account = entry.Account
		result.ExpiresAt = entry.ExpiresAt
	}
	mergeLiveLoginState(&result, provider)
	writeSuccess(c, result)
}

type AuthLoginRequest struct {
	Provider string `json:"provider"`
}

type AuthLoginResult struct {
	Provider          string `json:"provider"`
	Available         bool   `json:"available"`
	Status            string `json:"status"`
	LoginURL          string `json:"login_url,omitempty"`
	UserCode          string `json:"user_code,omitempty"`
	RequiresCode      bool   `json:"requires_code,omitempty"`
	UnavailableReason string `json:"unavailable_reason,omitempty"`
	MissingCommand    string `json:"missing_command,omitempty"`
}

func (s *Service) StartAuthLogin(c *gin.Context) {
	var req AuthLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid auth login payload"))
		return
	}
	provider, perr := normalizeOAuthProvider(req.Provider)
	if perr != nil {
		writePicoclawError(c, perr)
		return
	}

	capability := picoclawOAuthCapability()
	if !capability.Available {
		// Honest fallback: report unavailability and the exact command we expect
		// so the UI can explain precisely what the installed binary is missing.
		writeSuccess(c, AuthLoginResult{
			Provider:          provider,
			Available:         false,
			Status:            "unavailable",
			UnavailableReason: capability.Reason,
			MissingCommand:    deviceCodeMissingCommand(provider),
		})
		return
	}

	// Drive picoclaw's native device-code login. The runtime is stopped during
	// login to cut peak memory and restarted afterwards; the previous default
	// model is restored after login completes (see startDeviceCodeLogin).
	state := s.startDeviceCodeLogin(provider)
	writeSuccess(c, AuthLoginResult{
		Provider:     provider,
		Available:    true,
		Status:       state.Status,
		LoginURL:     state.LoginURL,
		UserCode:     state.UserCode,
		RequiresCode: false,
	})
}

type AuthCallbackRequest struct {
	Provider string `json:"provider"`
	Code     string `json:"code"`
	State    string `json:"state"`
}

// AuthCallback is a poll endpoint for the device-code flow. The login itself runs
// to completion in the background after the user authorizes in their browser;
// this just reports the current state (no code needs to be pasted back).
func (s *Service) AuthCallback(c *gin.Context) {
	var req AuthCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid auth callback payload"))
		return
	}
	provider, perr := normalizeOAuthProvider(req.Provider)
	if perr != nil {
		writePicoclawError(c, perr)
		return
	}

	result := AuthStatusResult{
		Provider:      provider,
		Available:     picoclawOAuthCapability().Available,
		Authenticated: isProviderOAuthAuthenticated(provider),
	}
	if entry, ok := loadPicoclawOAuthState().Providers[provider]; ok {
		result.Account = entry.Account
		result.ExpiresAt = entry.ExpiresAt
	}
	mergeLiveLoginState(&result, provider)
	writeSuccess(c, result)
}

type AuthLogoutRequest struct {
	Provider string `json:"provider"`
}

func (s *Service) AuthLogout(c *gin.Context) {
	var req AuthLogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid auth logout payload"))
		return
	}
	provider, perr := normalizeOAuthProvider(req.Provider)
	if perr != nil {
		writePicoclawError(c, perr)
		return
	}

	// Best-effort: ask the binary to drop credentials, then clear our hint and
	// any completed in-flight login state.
	if picoclawOAuthCapability().Available {
		_, _ = runPicoclawBinary(picoclawAuthProbeTimeout, "auth", "logout", "--provider", provider)
	}
	_ = clearProviderOAuthState(provider)
	clearDeviceCodeLogin()

	writeSuccess(c, AuthStatusResult{
		Provider:      provider,
		Available:     picoclawOAuthCapability().Available,
		Authenticated: false,
	})
}

package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

func TestCheckTokenUsesLiveRoleAndVersion(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	admin, ok, err := store.Authenticate("admin", "admin")
	if err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err = store.Create("alice", "valid-password", authn.RoleUser); err != nil {
		t.Fatal(err)
	}
	alice, err := store.Get("alice")
	if err != nil {
		t.Fatal(err)
	}

	restore := useTestAuthStore(t, store)
	defer restore()
	adminToken, err := GenerateJWT(admin.Username, admin.TokenVersion)
	if err != nil {
		t.Fatal(err)
	}
	userToken, err := GenerateJWT(alice.Username, alice.TokenVersion)
	if err != nil {
		t.Fatal(err)
	}

	router := gin.New()
	router.GET("/admin", CheckToken(), RequireRole(authn.RoleAdmin), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	if status := requestWithToken(router, "/admin", ""); status != http.StatusUnauthorized {
		t.Fatalf("missing token status = %d", status)
	}
	if status := requestWithToken(router, "/admin", adminToken); status != http.StatusNoContent {
		t.Fatalf("admin status = %d", status)
	}
	if status := requestWithToken(router, "/admin", userToken); status != http.StatusForbidden {
		t.Fatalf("user status = %d", status)
	}
	if _, err = store.Revoke("admin"); err != nil {
		t.Fatal(err)
	}
	if status := requestWithToken(router, "/admin", adminToken); status != http.StatusUnauthorized {
		t.Fatalf("revoked status = %d", status)
	}
}

func TestCheckTokenAcceptsBearerAndRejectsInvalidBearerOverCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	admin, ok, err := store.Authenticate("admin", "admin")
	if err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	restore := useTestAuthStore(t, store)
	defer restore()
	token, err := GenerateJWT(admin.Username, admin.TokenVersion)
	if err != nil {
		t.Fatal(err)
	}

	router := gin.New()
	router.GET("/account", CheckToken(), func(c *gin.Context) { c.Status(http.StatusNoContent) })

	request := httptest.NewRequest(http.MethodGet, "/account", nil)
	request.Header.Set("Authorization", "Bearer "+token)
	if status := serve(router, request); status != http.StatusNoContent {
		t.Fatalf("Bearer authentication status = %d, want %d", status, http.StatusNoContent)
	}

	// Authorization is deliberate: malformed credentials must not silently use
	// an unrelated ambient browser cookie.
	request = httptest.NewRequest(http.MethodGet, "/account", nil)
	request.Header.Set("Authorization", "Bearer invalid")
	request.AddCookie(&http.Cookie{Name: CookieName, Value: token})
	if status := serve(router, request); status != http.StatusUnauthorized {
		t.Fatalf("invalid Bearer with valid cookie status = %d, want %d", status, http.StatusUnauthorized)
	}

	for _, authorization := range []string{"Basic " + token, "Bearer", "Bearer ", "Bearer " + token + " extra"} {
		request = httptest.NewRequest(http.MethodGet, "/account", nil)
		request.Header.Set("Authorization", authorization)
		if status := serve(router, request); status != http.StatusUnauthorized {
			t.Fatalf("malformed Authorization %q status = %d, want %d", authorization, status, http.StatusUnauthorized)
		}
	}
}

func TestCheckTokenAuthenticationDisabledIgnoresCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)
	conf := config.GetInstance()
	originalAuthentication := conf.Authentication
	conf.Authentication = "disable"
	defer func() { conf.Authentication = originalAuthentication }()

	router := gin.New()
	router.GET("/account", CheckToken(), func(c *gin.Context) {
		principal, ok := CurrentPrincipal(c)
		if !ok || principal.Username != "admin" || principal.Role != authn.RoleAdmin {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.Status(http.StatusNoContent)
	})
	request := httptest.NewRequest(http.MethodGet, "/account", nil)
	request.Header.Set("Authorization", "Bearer invalid")
	if status := serve(router, request); status != http.StatusNoContent {
		t.Fatalf("disabled authentication status = %d, want %d", status, http.StatusNoContent)
	}
}

func TestParseJWTRejectsOtherHMACMethods(t *testing.T) {
	conf := config.GetInstance()
	originalSecret := conf.JWT.SecretKey
	conf.JWT.SecretKey = "test-secret"
	defer func() { conf.JWT.SecretKey = originalSecret }()

	now := time.Now()
	claims := Token{
		Username:     "admin",
		TokenVersion: 1,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "admin",
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS384, claims).SignedString([]byte(conf.JWT.SecretKey))
	if err != nil {
		t.Fatal(err)
	}
	if _, err = ParseJWT(token); err == nil {
		t.Fatal("HS384 token was accepted")
	}
}

func TestParseJWTRejectsExpiredToken(t *testing.T) {
	conf := config.GetInstance()
	originalSecret := conf.JWT.SecretKey
	conf.JWT.SecretKey = "test-secret"
	defer func() { conf.JWT.SecretKey = originalSecret }()

	claims := Token{
		Username:     "admin",
		TokenVersion: 1,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "admin",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Minute)),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(conf.JWT.SecretKey))
	if err != nil {
		t.Fatal(err)
	}
	if _, err = ParseJWT(token); err == nil {
		t.Fatal("expired token was accepted")
	}
}

func TestRevokeUserSessionsCancelsActiveRequests(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	unregister := activeSessions.register("alice", cancel)
	defer unregister()

	RevokeUserSessions("alice")
	select {
	case <-ctx.Done():
	case <-time.After(time.Second):
		t.Fatal("active session was not cancelled")
	}
}

func TestAccountFileResetCancelsActiveSession(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pwd")
	store := authn.NewStore(path)
	user, ok, err := store.Authenticate("admin", "admin")
	if err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	restore := useTestAuthStore(t, store)
	defer restore()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go watchSessionState(ctx, cancel, user.Username, user.TokenVersion, 10*time.Millisecond)
	if err = os.Remove(path); err != nil {
		t.Fatal(err)
	}
	select {
	case <-ctx.Done():
	case <-time.After(2 * time.Second):
		t.Fatal("active session survived account-file reset")
	}
}

func TestWatchWebSocketClosesRevokedConnection(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	upgrader := websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		connection, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			return
		}
		defer connection.Close()
		stop := WatchWebSocket(ctx, connection)
		defer stop()
		_, _, _ = connection.ReadMessage()
	}))
	defer server.Close()

	wsURL := "ws" + server.URL[len("http"):]
	connection, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	cancel()
	_ = connection.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, _, err = connection.ReadMessage()
	if !websocket.IsCloseError(err, SessionRevokedCloseCode) {
		t.Fatalf("close error = %v, want code %d", err, SessionRevokedCloseCode)
	}
}

func TestCheckWebSocketOrigin(t *testing.T) {
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalAllowedOrigins := conf.Security.AllowedOrigins
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Security.AllowedOrigins = originalAllowedOrigins
	}()
	conf.Security.TrustedProxies = nil
	conf.Security.AllowedOrigins = nil
	tests := []struct {
		origin string
		host   string
		want   bool
	}{
		{"", "kvm.local", true},
		{"http://kvm.local", "kvm.local", true},
		{"http://KVM.local", "kvm.local", true},
		{"http://kvm.local:8080", "kvm.local:8080", true},
		{"http://kvm.local:8081", "kvm.local:8080", false},
		{"https://kvm.local:80", "kvm.local:80", false},
		{"http://evil.example", "kvm.local", false},
	}
	for _, test := range tests {
		request := httptest.NewRequest(http.MethodGet, "http://"+test.host+"/api/ws", nil)
		request.Host = test.host
		if test.origin != "" {
			request.Header.Set("Origin", test.origin)
		}
		if got := CheckWebSocketOrigin(request); got != test.want {
			t.Fatalf("origin %q host %q = %v, want %v", test.origin, test.host, got, test.want)
		}
	}
}

func TestCheckWebSocketOriginTrustedProxy(t *testing.T) {
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalAllowedOrigins := conf.Security.AllowedOrigins
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Security.AllowedOrigins = originalAllowedOrigins
	}()
	conf.Security.TrustedProxies = []string{"10.0.0.0/8"}
	conf.Security.AllowedOrigins = nil

	request := httptest.NewRequest(http.MethodGet, "http://upstream:8080/api/ws", nil)
	request.Host = "upstream:8080"
	request.RemoteAddr = "10.1.2.3:4567"
	request.Header.Set("Origin", "https://kvm.example")
	request.Header.Set("X-Forwarded-Host", "kvm.example")
	request.Header.Set("X-Forwarded-Proto", "https")
	if !CheckWebSocketOrigin(request) {
		t.Fatal("trusted proxy origin was rejected")
	}

	request.RemoteAddr = "192.0.2.10:4567"
	if CheckWebSocketOrigin(request) {
		t.Fatal("untrusted peer was allowed to spoof forwarded headers")
	}
}

func TestCheckWebSocketOriginTrustedIPv6ProxyRejectsMultipleForwardedValues(t *testing.T) {
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalAllowedOrigins := conf.Security.AllowedOrigins
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Security.AllowedOrigins = originalAllowedOrigins
	}()
	conf.Security.TrustedProxies = []string{"::1/128"}
	conf.Security.AllowedOrigins = nil

	request := httptest.NewRequest(http.MethodGet, "http://upstream:8080/api/ws", nil)
	request.Host = "upstream:8080"
	request.RemoteAddr = "[::1]:4567"
	request.Header.Set("Origin", "https://[2001:db8::1]:8443")
	request.Header.Set("X-Forwarded-Host", "[2001:db8::1]:8443")
	request.Header.Set("X-Forwarded-Proto", "https")
	if !CheckWebSocketOrigin(request) {
		t.Fatal("trusted IPv6 proxy origin with a non-default port was rejected")
	}

	// Multiple values are ambiguous at this hop. The proxy must overwrite
	// these headers, not append client-provided values.
	request.Header.Set("X-Forwarded-Host", "[2001:db8::1]:8443, attacker.example")
	request.Header.Set("X-Forwarded-Proto", "https, http")
	if CheckWebSocketOrigin(request) {
		t.Fatal("multiple forwarded values were accepted")
	}
}

func TestCheckWebSocketOriginAllowedOrigin(t *testing.T) {
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalAllowedOrigins := conf.Security.AllowedOrigins
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Security.AllowedOrigins = originalAllowedOrigins
	}()
	conf.Security.TrustedProxies = nil
	conf.Security.AllowedOrigins = []string{"https://kvm.example"}
	request := httptest.NewRequest(http.MethodGet, "http://upstream:8080/api/ws", nil)
	request.Host = "upstream:8080"
	request.Header.Set("Origin", "https://kvm.example")
	if !CheckWebSocketOrigin(request) {
		t.Fatal("configured origin was rejected")
	}
	request.Header.Set("Origin", "https://evil.example")
	if CheckWebSocketOrigin(request) {
		t.Fatal("unconfigured origin was accepted")
	}
}

func TestCheckWebSocketOriginAllowedOriginRequiresExactPort(t *testing.T) {
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalAllowedOrigins := conf.Security.AllowedOrigins
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Security.AllowedOrigins = originalAllowedOrigins
	}()
	conf.Security.TrustedProxies = nil
	conf.Security.AllowedOrigins = []string{"https://kvm.example:8443"}

	request := httptest.NewRequest(http.MethodGet, "http://upstream:8080/api/ws", nil)
	request.Host = "upstream:8080"
	request.Header.Set("Origin", "https://kvm.example:8443")
	if !CheckWebSocketOrigin(request) {
		t.Fatal("configured non-default-port origin was rejected")
	}
	request.Header.Set("Origin", "https://kvm.example")
	if CheckWebSocketOrigin(request) {
		t.Fatal("allowed origin incorrectly matched a different port")
	}
}

func requestWithToken(handler http.Handler, path, token string) int {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, path, nil)
	request.AddCookie(&http.Cookie{Name: CookieName, Value: token})
	handler.ServeHTTP(recorder, request)
	return recorder.Code
}

func serve(handler http.Handler, request *http.Request) int {
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder.Code
}

func useTestAuthStore(t *testing.T, store *authn.Store) func() {
	t.Helper()
	originalStore := authn.DefaultStore
	conf := config.GetInstance()
	originalAuthentication := conf.Authentication
	originalSecret := conf.JWT.SecretKey
	originalDuration := conf.JWT.RefreshTokenDuration
	authn.DefaultStore = store
	conf.Authentication = "enable"
	conf.JWT.SecretKey = "test-secret"
	conf.JWT.RefreshTokenDuration = 3600
	return func() {
		authn.DefaultStore = originalStore
		conf.Authentication = originalAuthentication
		conf.JWT.SecretKey = originalSecret
		conf.JWT.RefreshTokenDuration = originalDuration
	}
}

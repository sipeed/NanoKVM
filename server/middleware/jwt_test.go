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

func requestWithToken(handler http.Handler, path, token string) int {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, path, nil)
	request.AddCookie(&http.Cookie{Name: CookieName, Value: token})
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

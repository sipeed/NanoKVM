package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	"github.com/mervick/aes-everywhere/go/aes256"
)

const formOpenSSLCiphertext = "U2FsdGVkX18zLUxaLNGy7jL96oMO4tq6wDYwVzUMO3XfTY2Zy/ipO4LDEqtBT+fx"

func TestLoginCookieAndUserAuthorizationLifecycle(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	authenticated := router.Group("/").Use(middleware.CheckToken())
	authenticated.GET("/account", service.GetAccount)
	authenticated.POST("/logout", service.Logout)
	admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
	admin.GET("/users", service.ListUsers)
	admin.POST("/users", service.CreateUser)
	admin.PUT("/users/:username", service.UpdateUser)

	adminCookie := loginCookie(t, router, "admin", "admin")
	if !adminCookie.HttpOnly || adminCookie.SameSite != http.SameSiteStrictMode || adminCookie.Path != "/" {
		t.Fatalf("unsafe session cookie: %+v", adminCookie)
	}

	createBody := map[string]any{
		"username": "alice",
		"password": encryptForRequest("valid-password"),
		"role":     "user",
	}
	if code := requestJSON(router, http.MethodPost, "/users", createBody, adminCookie); code != http.StatusOK {
		t.Fatalf("create status = %d", code)
	}
	userCookie := loginCookie(t, router, "alice", "valid-password")
	if code := requestJSON(router, http.MethodGet, "/users", nil, userCookie); code != http.StatusForbidden {
		t.Fatalf("user management status = %d, want 403", code)
	}

	disabled := false
	if code := requestJSON(router, http.MethodPut, "/users/alice", map[string]any{"enabled": disabled}, adminCookie); code != http.StatusOK {
		t.Fatalf("disable status = %d", code)
	}
	if code := requestJSON(router, http.MethodGet, "/account", nil, userCookie); code != http.StatusUnauthorized {
		t.Fatalf("disabled session status = %d, want 401", code)
	}
}

func TestRenameUserRevokesOldSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	authenticated := router.Group("/").Use(middleware.CheckToken())
	authenticated.GET("/account", service.GetAccount)
	admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
	admin.PUT("/users/:username", service.UpdateUser)

	adminCookie := loginCookie(t, router, "admin", "admin")
	renameResponse := requestJSONRecorder(router, http.MethodPut, "/users/admin", map[string]any{"username": "owner"}, adminCookie)
	if renameResponse.Code != http.StatusOK {
		t.Fatalf("rename status = %d", renameResponse.Code)
	}
	var response proto.Response
	if err := json.Unmarshal(renameResponse.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode rename response: %v", err)
	}
	if response.Code != 0 {
		t.Fatalf("rename response = %+v", response)
	}
	if code := requestJSON(router, http.MethodGet, "/account", nil, adminCookie); code != http.StatusUnauthorized {
		t.Fatalf("old session status = %d, want 401", code)
	}
	if _, ok, err := store.Authenticate("owner", "admin"); err != nil || !ok {
		t.Fatalf("renamed account login: ok=%v err=%v", ok, err)
	}
}

func TestUpdateUserOnlyRevokesActiveSessionsAfterActualChange(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	for _, test := range []struct {
		name      string
		username  string
		body      map[string]any
		cancelled bool
	}{
		{name: "no-op", username: "alice-noop", body: map[string]any{"role": "user"}},
		{name: "actual change", username: "alice-change", body: map[string]any{"enabled": false}, cancelled: true},
		{name: "rename", username: "alice-rename", body: map[string]any{"username": "owner"}, cancelled: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			if err := store.Create(test.username, "valid-password", authn.RoleUser); err != nil {
				t.Fatal(err)
			}
			service := NewService()
			router := gin.New()
			router.POST("/login", service.Login)
			authenticated := router.Group("/").Use(middleware.CheckToken())
			admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
			admin.PUT("/users/:username", service.UpdateUser)
			adminCookie := loginCookie(t, router, "admin", "admin")
			userCookie := loginCookie(t, router, test.username, "valid-password")
			started := make(chan struct{})
			done := make(chan struct{})
			release := make(chan struct{})
			var releaseOnce sync.Once
			releaseHold := func() { releaseOnce.Do(func() { close(release) }) }
			t.Cleanup(func() {
				releaseHold()
				select {
				case <-done:
				case <-time.After(time.Second):
					t.Error("active user request did not finish during cleanup")
				}
			})
			authenticated.GET("/hold", func(c *gin.Context) {
				close(started)
				select {
				case <-c.Request.Context().Done():
				case <-release:
				}
				close(done)
			})

			go func() {
				requestJSON(router, http.MethodGet, "/hold", nil, userCookie)
			}()
			select {
			case <-started:
			case <-time.After(time.Second):
				t.Fatal("active user request did not start")
			}

			if code := requestJSON(router, http.MethodPut, "/users/"+test.username, test.body, adminCookie); code != http.StatusOK {
				t.Fatalf("update status = %d", code)
			}
			if test.cancelled {
				select {
				case <-done:
				case <-time.After(time.Second):
					t.Fatal("actual update did not cancel the active user request")
				}
				return
			}
			select {
			case <-done:
				t.Fatal("no-op update cancelled the active user request")
			default:
			}
			releaseHold()
			select {
			case <-done:
			case <-time.After(time.Second):
				t.Fatal("active Alice request did not finish")
			}
		})
	}
}

func TestOtherAdminCannotRenameDeviceOwner(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("second", "second-password", authn.RoleAdmin); err != nil {
		t.Fatal(err)
	}
	owner, err := store.Get("admin")
	if err != nil {
		t.Fatal(err)
	}

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
	admin.PUT("/users/:username", service.UpdateUser)

	secondCookie := loginCookie(t, router, "second", "second-password")
	response := requestJSONRecorder(router, http.MethodPut, "/users/admin", map[string]any{"username": "owner"}, secondCookie)
	if response.Code != http.StatusOK {
		t.Fatalf("rename status = %d", response.Code)
	}
	var body proto.Response
	if err = json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode rename response: %v", err)
	}
	if body.Code == 0 || body.Msg != authn.ErrSystemAccountRename.Error() {
		t.Fatalf("rename response = %+v", body)
	}
	currentOwner, err := store.Get("admin")
	if err != nil || currentOwner.TokenVersion != owner.TokenVersion {
		t.Fatalf("device owner changed after rejected rename: user=%+v err=%v", currentOwner, err)
	}
	if _, err = store.Get("owner"); !errors.Is(err, authn.ErrUserNotFound) {
		t.Fatalf("rejected rename created target account: %v", err)
	}
}

func TestLoginReturnsTokenOnlyWhenExplicitlyRequested(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)

	request := jsonRequest(http.MethodPost, "/login", map[string]any{
		"username": "admin", "password": encryptForRequest("admin"),
	})
	request.Header.Set(ReturnTokenHeader, "true")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("automation login status = %d", recorder.Code)
	}
	var response struct {
		Code int            `json:"code"`
		Data proto.LoginRsp `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode automation login response: %v", err)
	}
	if response.Code != 0 || response.Data.Token == "" {
		t.Fatalf("automation login response = %s", recorder.Body.String())
	}
	if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}
	if got := recorder.Header().Get("Vary"); got != ReturnTokenHeader {
		t.Fatalf("Vary = %q, want %q", got, ReturnTokenHeader)
	}
	if _, err := middleware.ParseJWT(response.Data.Token); err != nil {
		t.Fatalf("returned token is invalid: %v", err)
	}
	if !hasSessionCookie(recorder.Result().Cookies()) {
		t.Fatal("automation login did not set session cookie")
	}
}

func TestLoginAcceptsFormEncodedRawOpenSSLPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, err := store.SetPassword("admin", "operator-password"); err != nil {
		t.Fatal(err)
	}

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)

	// This fixed OpenSSL ciphertext contains '+'. url.Values.Encode models the
	// body produced by curl --data-urlencode; Gin decodes it before Login calls
	// DecodeDecrypt, so a second QueryUnescape would corrupt the value.
	const ciphertext = formOpenSSLCiphertext
	form := url.Values{"username": {"admin"}, "password": {ciphertext}}
	request := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(form.Encode()))
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("form login status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if !hasSessionCookie(recorder.Result().Cookies()) {
		t.Fatal("form login did not set session cookie")
	}
}

func TestCreateUserAcceptsFormEncodedPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
	admin.POST("/users", service.CreateUser)
	adminCookie := loginCookie(t, router, "admin", "admin")
	const ciphertext = formOpenSSLCiphertext
	form := url.Values{
		"username": {"form-user"},
		"password": {ciphertext},
		"role":     {"user"},
	}
	request := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.AddCookie(adminCookie)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("form create status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if _, ok, err := store.Authenticate("form-user", "operator-password"); err != nil || !ok {
		t.Fatalf("form-created user login: ok=%v err=%v", ok, err)
	}
}

func TestLogoutDoesNotInvalidateAnotherUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("alice", "alice-password", authn.RoleUser); err != nil {
		t.Fatal(err)
	}
	if err := store.Create("bob", "bob-password", authn.RoleUser); err != nil {
		t.Fatal(err)
	}

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	authenticated := router.Group("/").Use(middleware.CheckToken())
	authenticated.GET("/account", service.GetAccount)
	authenticated.POST("/logout", service.Logout)

	aliceCookie := loginCookie(t, router, "alice", "alice-password")
	bobCookie := loginCookie(t, router, "bob", "bob-password")
	if code := requestJSON(router, http.MethodPost, "/logout", nil, aliceCookie); code != http.StatusOK {
		t.Fatalf("logout status = %d", code)
	}
	if code := requestJSON(router, http.MethodGet, "/account", nil, aliceCookie); code != http.StatusUnauthorized {
		t.Fatalf("logged out session status = %d", code)
	}
	if code := requestJSON(router, http.MethodGet, "/account", nil, bobCookie); code != http.StatusOK {
		t.Fatalf("other user's session status = %d", code)
	}
}

func TestNormalUserPasswordNeverChangesSystemPassword(t *testing.T) {
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("alice", "alice-password", authn.RoleUser); err != nil {
		t.Fatal(err)
	}

	originalUpdater := systemPasswordUpdater
	updates := 0
	systemPasswordUpdater = func(string) error {
		updates++
		return nil
	}
	defer func() { systemPasswordUpdater = originalUpdater }()

	if err := changeUserPassword("alice", encryptForRequest("new-password")); err != nil {
		t.Fatal(err)
	}
	if updates != 0 {
		t.Fatalf("system password updated %d times for a normal user", updates)
	}
	if _, ok, err := store.Authenticate("alice", "new-password"); err != nil || !ok {
		t.Fatalf("new web password login: ok=%v err=%v", ok, err)
	}
}

func TestSelfPasswordChangeRequiresCurrentPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("alice", "alice-password", authn.RoleUser); err != nil {
		t.Fatal(err)
	}

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	authenticated := router.Group("/").Use(middleware.CheckToken())
	authenticated.POST("/password", service.ChangePassword)
	cookie := loginCookie(t, router, "alice", "alice-password")

	recorder := requestJSONRecorder(router, http.MethodPost, "/password", map[string]any{
		"currentPassword": encryptForRequest("wrong-password"),
		"password":        encryptForRequest("new-password"),
	}, cookie)
	var response proto.Response
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode wrong-current-password response: %v", err)
	}
	if response.Code != -3 || response.Msg != "current password is incorrect" {
		t.Fatalf("wrong-current-password response = %+v", response)
	}
	if _, ok, err := store.Authenticate("alice", "new-password"); err != nil || ok {
		t.Fatalf("password changed without current credential: ok=%v err=%v", ok, err)
	}

	requestJSON(router, http.MethodPost, "/password", map[string]any{
		"currentPassword": encryptForRequest("alice-password"),
		"password":        encryptForRequest("new-password"),
	}, cookie)
	if _, ok, err := store.Authenticate("alice", "new-password"); err != nil || !ok {
		t.Fatalf("valid password change failed: ok=%v err=%v", ok, err)
	}
}

func TestAdministratorCannotResetDeviceOwnerPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("second-admin", "second-password", authn.RoleAdmin); err != nil {
		t.Fatal(err)
	}

	originalUpdater := systemPasswordUpdater
	updates := 0
	systemPasswordUpdater = func(string) error {
		updates++
		return nil
	}
	defer func() { systemPasswordUpdater = originalUpdater }()

	service := NewService()
	router := gin.New()
	router.POST("/login", service.Login)
	admin := router.Group("/").Use(middleware.CheckToken(), middleware.RequireRole(authn.RoleAdmin))
	admin.POST("/users/:username/password", service.ChangeUserPassword)
	cookie := loginCookie(t, router, "second-admin", "second-password")
	requestJSON(router, http.MethodPost, "/users/admin/password", map[string]any{
		"password": encryptForRequest("new-password"),
	}, cookie)

	if updates != 0 {
		t.Fatalf("administrator changed the device owner's system password %d times", updates)
	}
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("device owner password changed: ok=%v err=%v", ok, err)
	}
	if _, ok, err := store.Authenticate("admin", "new-password"); err != nil || ok {
		t.Fatalf("unauthorized password became active: ok=%v err=%v", ok, err)
	}
}

func TestSystemPasswordFailureRollsBackWebPassword(t *testing.T) {
	store := authn.NewStore(filepath.Join(t.TempDir(), "pwd"))
	restore := useTestStore(store)
	defer restore()
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}

	originalUpdater := systemPasswordUpdater
	systemPasswordUpdater = func(string) error { return errors.New("passwd failed") }
	defer func() { systemPasswordUpdater = originalUpdater }()

	if err := changeUserPassword("admin", encryptForRequest("new-password")); err == nil {
		t.Fatal("system password failure was ignored")
	}
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("old web password was not restored: ok=%v err=%v", ok, err)
	}
	if _, ok, err := store.Authenticate("admin", "new-password"); err != nil || ok {
		t.Fatalf("failed password stayed active: ok=%v err=%v", ok, err)
	}
}

func loginCookie(t *testing.T, handler http.Handler, username, password string) *http.Cookie {
	t.Helper()
	body := map[string]any{"username": username, "password": encryptForRequest(password)}
	recorder := httptest.NewRecorder()
	request := jsonRequest(http.MethodPost, "/login", body)
	handler.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("login status = %d", recorder.Code)
	}
	if bytes.Contains(recorder.Body.Bytes(), []byte("token")) {
		t.Fatalf("login exposed JWT in response: %s", recorder.Body.String())
	}
	if got := recorder.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}
	if got := recorder.Header().Get("Vary"); got != ReturnTokenHeader {
		t.Fatalf("Vary = %q, want %q", got, ReturnTokenHeader)
	}
	for _, cookie := range recorder.Result().Cookies() {
		if cookie.Name == middleware.CookieName {
			return cookie
		}
	}
	t.Fatal("login did not set session cookie")
	return nil
}

func hasSessionCookie(cookies []*http.Cookie) bool {
	for _, cookie := range cookies {
		if cookie.Name == middleware.CookieName {
			return true
		}
	}
	return false
}

func requestJSON(handler http.Handler, method, path string, body any, cookie *http.Cookie) int {
	return requestJSONRecorder(handler, method, path, body, cookie).Code
}

func requestJSONRecorder(handler http.Handler, method, path string, body any, cookie *http.Cookie) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	request := jsonRequest(method, path, body)
	if cookie != nil {
		request.AddCookie(cookie)
	}
	handler.ServeHTTP(recorder, request)
	return recorder
}

func jsonRequest(method, path string, body any) *http.Request {
	var data []byte
	if body != nil {
		data, _ = json.Marshal(body)
	}
	request := httptest.NewRequest(method, path, bytes.NewReader(data))
	request.Header.Set("Content-Type", "application/json")
	return request
}

func encryptForRequest(password string) string {
	return url.QueryEscape(aes256.Encrypt(password, utils.SecretKey))
}

func useTestStore(store *authn.Store) func() {
	originalStore := authn.DefaultStore
	conf := config.GetInstance()
	originalAuthentication := conf.Authentication
	originalSecret := conf.JWT.SecretKey
	originalDuration := conf.JWT.RefreshTokenDuration
	originalRevokeOnLogout := conf.JWT.RevokeTokensOnLogout
	authn.DefaultStore = store
	conf.Authentication = "enable"
	conf.JWT.SecretKey = "test-secret"
	conf.JWT.RefreshTokenDuration = 3600
	conf.JWT.RevokeTokensOnLogout = true
	return func() {
		authn.DefaultStore = originalStore
		conf.Authentication = originalAuthentication
		conf.JWT.SecretKey = originalSecret
		conf.JWT.RefreshTokenDuration = originalDuration
		conf.JWT.RevokeTokensOnLogout = originalRevokeOnLogout
	}
}

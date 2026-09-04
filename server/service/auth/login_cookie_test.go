package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"NanoKVM-Server/config"

	"github.com/gin-gonic/gin"
)

func TestSessionCookieOnlyTrustsConfiguredProxy(t *testing.T) {
	gin.SetMode(gin.TestMode)
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalProto := conf.Proto
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Proto = originalProto
	}()
	conf.Proto = "http"
	conf.Security.TrustedProxies = []string{"127.0.0.1"}

	for _, test := range []struct {
		name       string
		remoteAddr string
		secure     bool
	}{
		{name: "trusted proxy", remoteAddr: "127.0.0.1:1234", secure: true},
		{name: "untrusted peer", remoteAddr: "192.0.2.1:1234", secure: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			request := httptest.NewRequest(http.MethodPost, "http://upstream/login", nil)
			request.RemoteAddr = test.remoteAddr
			request.Header.Set("X-Forwarded-Proto", "https")
			context.Request = request
			setSessionCookie(context, "token")
			cookies := recorder.Result().Cookies()
			if len(cookies) != 1 || cookies[0].Secure != test.secure {
				t.Fatalf("cookie = %+v, want Secure=%v", cookies, test.secure)
			}
		})
	}
}

func TestSessionCookieForwardedProtoRejectsMultipleValues(t *testing.T) {
	gin.SetMode(gin.TestMode)
	conf := config.GetInstance()
	originalTrustedProxies := conf.Security.TrustedProxies
	originalProto := conf.Proto
	defer func() {
		conf.Security.TrustedProxies = originalTrustedProxies
		conf.Proto = originalProto
	}()
	conf.Proto = "http"
	conf.Security.TrustedProxies = []string{"::1/128"}

	for _, test := range []struct {
		name       string
		remoteAddr string
		xfp        string
		secure     bool
	}{
		{name: "trusted IPv6 proxy accepts a single forwarded scheme", remoteAddr: "[::1]:1234", xfp: "https", secure: true},
		{name: "trusted IPv6 proxy rejects multiple forwarded schemes", remoteAddr: "[::1]:1234", xfp: "https, http", secure: false},
		{name: "untrusted IPv6 peer cannot force secure cookie", remoteAddr: "[2001:db8::2]:1234", xfp: "https", secure: false},
		{name: "trusted proxy ignores invalid forwarded scheme", remoteAddr: "[::1]:1234", xfp: "ftp", secure: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			request := httptest.NewRequest(http.MethodPost, "http://upstream/login", nil)
			request.RemoteAddr = test.remoteAddr
			request.Header.Set("X-Forwarded-Proto", test.xfp)
			context.Request = request
			setSessionCookie(context, "token")
			cookies := recorder.Result().Cookies()
			if len(cookies) != 1 || cookies[0].Secure != test.secure {
				t.Fatalf("cookie = %+v, want Secure=%v", cookies, test.secure)
			}
		})
	}
}

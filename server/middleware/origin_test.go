package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func requestWithOrigin(host string, origin string) *http.Request {
	r := httptest.NewRequest(http.MethodPost, "/api/vm/script/run", nil)
	r.Host = host
	if origin != "" {
		r.Header.Set("Origin", origin)
	}
	return r
}

func TestSameOriginAllowsRequestWithoutOriginHeader(t *testing.T) {
	// Non-browser clients (curl, scripts, the picoclaw agent) send no Origin.
	// Browsers always send one on cross-site POSTs and websocket handshakes,
	// so absence cannot be forged by a page and must stay allowed.
	if !SameOrigin(requestWithOrigin("nanokvm.local", "")) {
		t.Fatal("request without an Origin header must be allowed")
	}
}

func TestSameOriginAllowsMatchingHost(t *testing.T) {
	if !SameOrigin(requestWithOrigin("nanokvm.local", "http://nanokvm.local")) {
		t.Fatal("same-host origin must be allowed")
	}
}

func TestSameOriginAllowsMatchingHostAndPort(t *testing.T) {
	if !SameOrigin(requestWithOrigin("nanokvm.local:8080", "http://nanokvm.local:8080")) {
		t.Fatal("same host:port origin must be allowed")
	}
}

func TestSameOriginAllowsHttpsOriginOnHttpHost(t *testing.T) {
	// The device serves the same UI over both http:80 and https:443, so a
	// request from one to the other is still the same device.
	if !SameOrigin(requestWithOrigin("nanokvm.local", "https://nanokvm.local")) {
		t.Fatal("https origin on the same host must be allowed")
	}
}

func TestSameOriginAllowsIPv6Host(t *testing.T) {
	if !SameOrigin(requestWithOrigin("[fe80::1]:443", "https://[fe80::1]")) {
		t.Fatal("matching IPv6 origin must be allowed")
	}
}

func TestSameOriginRejectsForeignHost(t *testing.T) {
	if SameOrigin(requestWithOrigin("nanokvm.local", "https://evil.example.com")) {
		t.Fatal("cross-site origin must be rejected")
	}
}

func TestSameOriginRejectsForeignHostSharingSuffix(t *testing.T) {
	if SameOrigin(requestWithOrigin("nanokvm.local", "https://evilnanokvm.local")) {
		t.Fatal("origin that merely shares a suffix must be rejected")
	}
}

func TestSameOriginRejectsNullOrigin(t *testing.T) {
	// Sandboxed iframes and some redirects produce "null".
	if SameOrigin(requestWithOrigin("nanokvm.local", "null")) {
		t.Fatal("null origin must be rejected")
	}
}

func TestSameOriginRejectsUnparsableOrigin(t *testing.T) {
	if SameOrigin(requestWithOrigin("nanokvm.local", "://not a url")) {
		t.Fatal("unparsable origin must be rejected")
	}
}

func TestSameOriginRejectsOriginWithoutHost(t *testing.T) {
	if SameOrigin(requestWithOrigin("nanokvm.local", "file://")) {
		t.Fatal("origin without a host must be rejected")
	}
}

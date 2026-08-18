package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"NanoKVM-Server/config"
)

// SameOrigin reports whether the request may act on the device.
//
// Browsers always attach an Origin header to cross-site POST requests and to
// websocket handshakes, so comparing it against the host the request was sent
// to is what stops a hostile page from riding the session cookie (CSRF and
// cross-site websocket hijacking). Requests without an Origin header come from
// non-browser clients, which cannot be driven by a web page, and are allowed.
// Only the hostname is compared: the device serves the same UI over both http
// and https, so an origin arriving on the other port is still the same device.
func SameOrigin(r *http.Request) bool {
	if r == nil {
		return false
	}

	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}

	u, err := url.Parse(origin)
	if err != nil || u.Host == "" {
		return false
	}

	// Both sides go through the same accessor, so a port or the brackets
	// around an IPv6 literal are stripped the same way on each.
	target := &url.URL{Host: r.Host}

	return strings.EqualFold(u.Hostname(), target.Hostname())
}

// allowByOrigin applies SameOrigin unless authentication is switched off, a
// mode in which the API is deliberately open (main.go also enables permissive
// CORS there) and origin enforcement would contradict the operator's choice.
func allowByOrigin(r *http.Request) bool {
	if config.GetInstance().Authentication == "disable" {
		return true
	}

	return SameOrigin(r)
}

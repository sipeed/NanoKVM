package middleware

import (
	"crypto/subtle"
	"net"
	"net/http"
	"strings"

	"NanoKVM-Server/config"
)

func ListenAndServeLoopbackHTTPRedirect(
	httpAddr string,
	httpsPort string,
	handler http.Handler,
	allowedPaths ...string,
) error {
	allowlist := make(map[string]struct{}, len(allowedPaths))
	for _, path := range allowedPaths {
		if strings.TrimSpace(path) == "" {
			continue
		}
		allowlist[path] = struct{}{}
	}

	return http.ListenAndServe(httpAddr, http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if isLoopbackAllowedPath(req, allowlist) {
			if hasValidLoopbackHTTPToken(req) {
				handler.ServeHTTP(w, req)
				return
			}

			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		host := req.Host
		if h, _, err := net.SplitHostPort(host); err == nil {
			host = h
		}
		if httpsPort != "443" {
			host = net.JoinHostPort(host, httpsPort)
		}

		http.Redirect(w, req, "https://"+host+req.URL.RequestURI(), http.StatusTemporaryRedirect)
	}))
}

func allowByLoopbackInternalToken(req *http.Request) bool {
	return req != nil && isLoopbackRemote(req.RemoteAddr) && hasValidLoopbackHTTPToken(req)
}

func isLoopbackAllowedPath(req *http.Request, allowedPaths map[string]struct{}) bool {
	if !allowByLoopbackInternalToken(req) {
		return false
	}

	_, allowed := allowedPaths[req.URL.Path]
	return allowed
}

func hasValidLoopbackHTTPToken(req *http.Request) bool {
	if req == nil {
		return false
	}
	token, err := config.GetPicoclawInternalToken()
	if err != nil || token == "" {
		return false
	}

	provided := req.Header.Get(config.PicoclawInternalTokenHeader)
	return subtle.ConstantTimeCompare([]byte(provided), []byte(token)) == 1
}

func isLoopbackRemote(remoteAddr string) bool {
	host := strings.TrimSpace(remoteAddr)
	if parsedHost, _, err := net.SplitHostPort(remoteAddr); err == nil {
		host = parsedHost
	}

	ip := net.ParseIP(strings.Trim(host, "[]"))
	return ip != nil && ip.IsLoopback()
}

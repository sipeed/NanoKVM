package middleware

import (
	"context"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

const SessionRevokedCloseCode = 4401

type sessionRegistry struct {
	mutex    sync.Mutex
	nextID   atomic.Uint64
	byUserID map[string]map[uint64]context.CancelFunc
}

var activeSessions = &sessionRegistry{byUserID: make(map[string]map[uint64]context.CancelFunc)}

func (r *sessionRegistry) register(username string, cancel context.CancelFunc) func() {
	id := r.nextID.Add(1)
	r.mutex.Lock()
	if r.byUserID[username] == nil {
		r.byUserID[username] = make(map[uint64]context.CancelFunc)
	}
	r.byUserID[username][id] = cancel
	r.mutex.Unlock()

	return func() {
		r.mutex.Lock()
		delete(r.byUserID[username], id)
		if len(r.byUserID[username]) == 0 {
			delete(r.byUserID, username)
		}
		r.mutex.Unlock()
	}
}

func RevokeUserSessions(username string) {
	activeSessions.mutex.Lock()
	sessions := activeSessions.byUserID[username]
	delete(activeSessions.byUserID, username)
	activeSessions.mutex.Unlock()

	for _, cancel := range sessions {
		cancel()
	}
}

func WatchWebSocket(ctx context.Context, connection *websocket.Conn) func() {
	stopped := make(chan struct{})
	var stopOnce sync.Once
	go func() {
		select {
		case <-ctx.Done():
			_ = connection.WriteControl(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(SessionRevokedCloseCode, "session expired or revoked"),
				time.Now().Add(2*time.Second),
			)
			_ = connection.Close()
		case <-stopped:
		}
	}()
	return func() { stopOnce.Do(func() { close(stopped) }) }
}

func CheckWebSocketOrigin(request *http.Request) bool {
	origin := strings.TrimSpace(request.Header.Get("Origin"))
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Host == "" {
		return false
	}
	requestScheme := "http"
	if request.TLS != nil {
		requestScheme = "https"
	}
	if forwarded := strings.TrimSpace(strings.Split(request.Header.Get("X-Forwarded-Proto"), ",")[0]); forwarded != "" {
		requestScheme = strings.ToLower(forwarded)
	}
	return equalOrigin(parsed, request.Host, requestScheme)
}

func equalOrigin(origin *url.URL, requestHost, requestScheme string) bool {
	originHost, originPort := splitHostPort(origin.Host)
	host, port := splitHostPort(requestHost)
	if !strings.EqualFold(originHost, host) {
		return false
	}
	if originPort == "" {
		originPort = defaultPort(origin.Scheme)
	}
	if port == "" {
		port = defaultPort(requestScheme)
	}
	return originPort == port
}

func splitHostPort(value string) (string, string) {
	host, port, err := net.SplitHostPort(value)
	if err == nil {
		return host, port
	}
	return strings.Trim(value, "[]"), ""
}

func defaultPort(scheme string) string {
	switch strings.ToLower(scheme) {
	case "https", "wss":
		return "443"
	default:
		return "80"
	}
}

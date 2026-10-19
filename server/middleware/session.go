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

// SessionRefreshedCloseCode closes connections whose permissions changed while
// the underlying login is still valid. Clients are expected to reconnect and
// refresh their account state instead of returning to the login page.
const SessionRefreshedCloseCode = 4403

type sessionHandleKey struct{}

// Long-lived connection channels, used to drop only the connections affected
// by a permission change instead of every session of the user.
const (
	SessionChannelConsole  = "console"  // /api/ws (input events, status pushes)
	SessionChannelStream   = "stream"   // /api/stream/* (video signaling and frames)
	SessionChannelTerminal = "terminal" // /api/vm/terminal
	SessionChannelAi       = "ai"       // /api/picoclaw/gateway/ws
)

// SessionChannelForPath classifies long-lived endpoints; everything else
// returns an empty channel and is only affected by hard revocation.
func SessionChannelForPath(path string) string {
	switch {
	case path == "/api/ws":
		return SessionChannelConsole
	case strings.HasPrefix(path, "/api/stream/"):
		return SessionChannelStream
	case path == "/api/vm/terminal":
		return SessionChannelTerminal
	case path == "/api/picoclaw/gateway/ws":
		return SessionChannelAi
	default:
		return ""
	}
}

// sessionHandle lets a revocation pick the WebSocket close code before the
// request context is canceled.
type sessionHandle struct {
	closeCode atomic.Int32
}

type sessionEntry struct {
	cancel  context.CancelFunc
	handle  *sessionHandle
	channel string
}

type sessionRegistry struct {
	mutex    sync.Mutex
	nextID   atomic.Uint64
	byUserID map[string]map[uint64]*sessionEntry
}

var activeSessions = &sessionRegistry{byUserID: make(map[string]map[uint64]*sessionEntry)}

func newSessionHandle() *sessionHandle {
	handle := &sessionHandle{}
	handle.closeCode.Store(SessionRevokedCloseCode)
	return handle
}

// WithSessionHandle attaches the handle to the request context so
// WatchWebSocket can honor the close code chosen at revocation time.
func WithSessionHandle(ctx context.Context, handle *sessionHandle) context.Context {
	return context.WithValue(ctx, sessionHandleKey{}, handle)
}

func (r *sessionRegistry) register(username string, cancel context.CancelFunc, handle *sessionHandle, channel string) func() {
	id := r.nextID.Add(1)
	r.mutex.Lock()
	if r.byUserID[username] == nil {
		r.byUserID[username] = make(map[uint64]*sessionEntry)
	}
	r.byUserID[username][id] = &sessionEntry{cancel: cancel, handle: handle, channel: channel}
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

// RevokeUserSessions hard-drops every active session of the user. The login
// is expected to be invalid afterwards; connections close as unauthorized.
func RevokeUserSessions(username string) {
	dropUserSessions(username, SessionRevokedCloseCode, nil)
}

// RefreshUserSessions drops the user's long-lived connections on the given
// channels while their login stays valid, so those clients reconnect under
// the updated permissions. Unrelated connections (e.g. the video stream when
// only console control was revoked) stay untouched.
func RefreshUserSessions(username string, channels ...string) {
	dropUserSessions(username, SessionRefreshedCloseCode, channels)
}

func dropUserSessions(username string, closeCode int, channels []string) {
	activeSessions.mutex.Lock()
	sessions := activeSessions.byUserID[username]
	if channels == nil {
		delete(activeSessions.byUserID, username)
	}

	dropped := make([]*sessionEntry, 0, len(sessions))
	for id, entry := range sessions {
		if !channelMatches(entry.channel, channels) {
			continue
		}
		dropped = append(dropped, entry)
		if channels != nil {
			delete(sessions, id)
		}
	}
	if channels != nil && len(sessions) == 0 {
		delete(activeSessions.byUserID, username)
	}
	activeSessions.mutex.Unlock()

	for _, entry := range dropped {
		entry.handle.closeCode.Store(int32(closeCode))
		entry.cancel()
	}
}

// channelMatches reports whether the entry is affected. A nil channel list
// means a hard revocation, which drops everything.
func channelMatches(channel string, channels []string) bool {
	if channels == nil {
		return true
	}
	for _, candidate := range channels {
		if channel == candidate {
			return true
		}
	}
	return false
}

func WatchWebSocket(ctx context.Context, connection *websocket.Conn) func() {
	stopped := make(chan struct{})
	var stopOnce sync.Once
	go func() {
		select {
		case <-ctx.Done():
			closeCode := SessionRevokedCloseCode
			reason := "session expired or revoked"
			if handle, ok := ctx.Value(sessionHandleKey{}).(*sessionHandle); ok {
				if code := int(handle.closeCode.Load()); code == SessionRefreshedCloseCode {
					closeCode = code
					reason = "permissions changed"
				}
			}
			_ = connection.WriteControl(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(closeCode, reason),
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

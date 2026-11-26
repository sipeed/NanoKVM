package vm

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func TestTerminalSendsSessionIDOnWebSocketConnect(t *testing.T) {
	gin.SetMode(gin.TestMode)

	session := &terminalSession{
		ID:        "test-session-id",
		Username:  "terminal-test",
		CreatedAt: time.Now(),
	}
	if !terminalSessions.add(session) {
		t.Skip("device is at the terminal session limit")
	}
	t.Cleanup(func() { session.closeWithCode(0, "") })

	router := gin.New()
	router.GET("/api/vm/terminal", func(c *gin.Context) {
		c.Set("principal", middleware.Principal{Username: "terminal-test", Role: authn.RoleUser})
		NewService().Terminal(c)
	})
	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/vm/terminal?session=" + session.ID
	connection, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("connect terminal websocket: %v", err)
	}
	defer connection.Close()
	if err := connection.SetReadDeadline(time.Now().Add(5 * time.Second)); err != nil {
		t.Fatalf("set websocket read deadline: %v", err)
	}

	for {
		messageType, data, err := connection.ReadMessage()
		if err != nil {
			t.Fatalf("read terminal websocket message: %v", err)
		}
		if messageType != websocket.TextMessage {
			continue
		}

		var message map[string]string
		if err := json.Unmarshal(data, &message); err != nil {
			continue
		}
		if len(message) != 2 || message["type"] != "session" || message["sessionId"] != session.ID {
			t.Fatalf("unexpected terminal session control frame: %s", data)
		}
		if terminalSessions.get(message["sessionId"]) != session {
			t.Fatalf("session %q was not registered", message["sessionId"])
		}
		return
	}
}

func TestTerminalSessionRegistryEnforcesLimit(t *testing.T) {
	registry := &terminalSessionRegistry{sessions: make(map[string]*terminalSession)}
	for i := 0; i < maxTerminalSessions; i++ {
		if !registry.add(&terminalSession{ID: fmt.Sprintf("session-%d", i)}) {
			t.Fatalf("session %d was rejected below the limit", i)
		}
	}

	if registry.add(&terminalSession{ID: "one-too-many"}) {
		t.Fatal("session above the configured limit was accepted")
	}
	if got := len(registry.list()); got != maxTerminalSessions {
		t.Fatalf("registry contains %d sessions, want %d", got, maxTerminalSessions)
	}
}

func TestTerminalRejectsNewShellAtSessionLimit(t *testing.T) {
	previousRegistry := terminalSessions
	terminalSessions = &terminalSessionRegistry{sessions: make(map[string]*terminalSession)}
	t.Cleanup(func() { terminalSessions = previousRegistry })
	for i := 0; i < maxTerminalSessions; i++ {
		if !terminalSessions.add(&terminalSession{ID: fmt.Sprintf("occupied-%d", i)}) {
			t.Fatalf("failed to register occupied session %d", i)
		}
	}

	router := gin.New()
	router.GET("/api/vm/terminal", func(c *gin.Context) {
		c.Set("principal", middleware.Principal{Username: "terminal-test", Role: authn.RoleUser})
		NewService().Terminal(c)
	})
	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/vm/terminal"
	connection, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("connect terminal websocket: %v", err)
	}
	defer connection.Close()
	_, _, err = connection.ReadMessage()
	if !websocket.IsCloseError(err, terminalSessionLimitCode) {
		t.Fatalf("close error = %v, want code %d", err, terminalSessionLimitCode)
	}
}

func TestRemoteClientIPUsesSocketPeer(t *testing.T) {
	tests := []struct {
		remoteAddr string
		want       string
	}{
		{remoteAddr: "192.0.2.10:54321", want: "192.0.2.10"},
		{remoteAddr: "[2001:db8::1]:54321", want: "2001:db8::1"},
		{remoteAddr: "unknown", want: "unknown"},
	}
	for _, test := range tests {
		if got := remoteClientIP(test.remoteAddr); got != test.want {
			t.Errorf("remoteClientIP(%q) = %q, want %q", test.remoteAddr, got, test.want)
		}
	}
}

func TestTerminalSessionAccessIsScopedToOwner(t *testing.T) {
	session := &terminalSession{Username: "alice"}
	makeContext := func(principal middleware.Principal) *gin.Context {
		context, _ := gin.CreateTestContext(httptest.NewRecorder())
		context.Set("principal", principal)
		return context
	}

	if !canAccessTerminalSession(makeContext(middleware.Principal{Username: "alice", Role: authn.RoleUser}), session) {
		t.Fatal("owner should be able to access their terminal session")
	}
	if canAccessTerminalSession(makeContext(middleware.Principal{Username: "bob", Role: authn.RoleUser}), session) {
		t.Fatal("another user must not access this terminal session")
	}
	if !canAccessTerminalSession(makeContext(middleware.Principal{Username: "admin", Role: authn.RoleAdmin}), session) {
		t.Fatal("administrator should be able to manage all terminal sessions")
	}
}

func TestTerminalSessionRegistryLimitIsEight(t *testing.T) {
	if maxTerminalSessions != 8 {
		t.Fatalf("maxTerminalSessions = %d, want 8", maxTerminalSessions)
	}
}

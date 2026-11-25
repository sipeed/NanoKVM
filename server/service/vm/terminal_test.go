package vm

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func TestTerminalSendsSessionIDOnWebSocketConnect(t *testing.T) {
	gin.SetMode(gin.TestMode)

	existing := make(map[string]struct{})
	for _, session := range terminalSessions.list() {
		existing[session.ID] = struct{}{}
	}
	t.Cleanup(func() {
		for _, session := range terminalSessions.list() {
			if _, ok := existing[session.ID]; !ok {
				session.closeWithCode(0, "")
			}
		}
	})

	router := gin.New()
	router.GET("/api/vm/terminal", NewService().Terminal)
	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/vm/terminal"
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

		var message terminalSessionControlMessage
		if err := json.Unmarshal(data, &message); err == nil &&
			message.Type == terminalSessionIDType && message.SessionID != "" {
			if terminalSessions.get(message.SessionID) == nil {
				t.Fatalf("session %q was not registered", message.SessionID)
			}
			return
		}
	}
}

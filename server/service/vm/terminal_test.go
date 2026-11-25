package vm

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func TestTerminalSendsSessionIDOnWebSocketConnect(t *testing.T) {
	gin.SetMode(gin.TestMode)

	request := httptest.NewRequest("GET", "/api/vm/terminal", nil)
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = request
	if _, err := os.Stat("/root"); err != nil {
		t.Skipf("terminal test requires /root as the shell working directory: %v", err)
	}
	session, err := newTerminalSession(context)
	if err != nil {
		t.Fatalf("start terminal PTY: %v", err)
	}
	t.Cleanup(func() { session.closeWithCode(0, "") })

	router := gin.New()
	router.GET("/api/vm/terminal", NewService().Terminal)
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

package vm

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/middleware"
)

const (
	messageWait               = 10 * time.Second
	maxMessageSize            = 1024
	terminalHeartbeatType     = "ping"
	terminalHeartbeatResponse = `{"type":"pong"}`
	terminalSessionIDType     = "session"
	terminalSessionLimitCode  = 4412
)

type WinSize struct {
	Rows uint16 `json:"rows"`
	Cols uint16 `json:"cols"`
}

type terminalMessage struct {
	Type string `json:"type"`
	WinSize
}

type terminalSessionControlMessage struct {
	Type      string `json:"type"`
	SessionID string `json:"sessionId"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  maxMessageSize,
	WriteBufferSize: maxMessageSize,
	CheckOrigin:     middleware.CheckWebSocketOrigin,
}

// Terminal upgrades the request to a websocket and attaches it to a terminal
// session. A request without a session id creates a new shell; a request with a
// session id reattaches to an existing session, so a dropped page can resume the
// same shell from another tab or browser.
func (s *Service) Terminal(c *gin.Context) {
	sessionID := c.Query("session")
	session := terminalSessions.get(sessionID)
	if sessionID != "" && (session == nil || !canAccessTerminalSession(c, session)) {
		log.Debugf("terminal session %s not found", sessionID)
		c.JSON(http.StatusNotFound, "terminal session not found")
		return
	}

	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to init websocket: %s", err)
		return
	}
	defer func() {
		_ = ws.Close()
	}()
	stopSessionWatcher := middleware.WatchWebSocket(c.Request.Context(), ws)
	defer stopSessionWatcher()

	session = terminalSessions.get(sessionID)
	if sessionID != "" && (session == nil || !canAccessTerminalSession(c, session)) {
		// The session ended or changed ownership between the check and upgrade.
		return
	}
	if session == nil {
		if !terminalSessions.hasCapacity() {
			_ = ws.WriteControl(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(terminalSessionLimitCode, "terminal session limit reached"),
				time.Now().Add(messageWait),
			)
			return
		}
		session, err = newTerminalSession(c)
		if err != nil {
			log.Errorf("failed to start pty: %s", err)
			if errors.Is(err, errTerminalSessionLimit) {
				_ = ws.WriteControl(
					websocket.CloseMessage,
					websocket.FormatCloseMessage(terminalSessionLimitCode, "terminal session limit reached"),
					time.Now().Add(messageWait),
				)
			}
			return
		}
	}

	if err := session.attach(ws); err != nil {
		log.Errorf("failed to attach terminal session %s: %s", session.ID, err)
		return
	}
	defer session.detach(ws)

	sessionMessage, err := json.Marshal(terminalSessionControlMessage{
		Type:      terminalSessionIDType,
		SessionID: session.ID,
	})
	if err != nil {
		log.Errorf("failed to encode terminal session %s id: %s", session.ID, err)
		return
	}
	if err := session.writeControl(ws, sessionMessage); err != nil {
		log.Debugf("failed to send terminal session %s id: %s", session.ID, err)
		return
	}

	session.readInput(ws)

	// A canceled request context means the auth middleware revoked this
	// connection (logout, expired login or changed permissions); kill the shell
	// instead of leaving it detached for another account to reuse.
	select {
	case <-c.Request.Context().Done():
		session.close()
	default:
	}
}

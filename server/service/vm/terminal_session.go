package vm

import (
	"crypto/rand"
	"encoding/hex"
	"sort"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
)

const (
	terminalKindShell  = "shell"
	terminalKindSerial = "serial"

	maxTerminalSessionUserAgent = 256
)

// terminalSession describes one web terminal connection. Metadata is
// immutable after creation, only the websocket pointer is used to close it.
type terminalSession struct {
	ID        string
	Kind      string
	Username  string
	Port      string
	Baud      string
	ClientIP  string
	UserAgent string
	CreatedAt time.Time

	ws        *websocket.Conn
	closeOnce sync.Once
}

func (s *terminalSession) close() {
	s.closeOnce.Do(func() {
		if s.ws != nil {
			_ = s.ws.Close()
		}
	})
}

type terminalSessionRegistry struct {
	mutex    sync.RWMutex
	sessions map[string]*terminalSession
}

var terminalSessions = &terminalSessionRegistry{
	sessions: make(map[string]*terminalSession),
}

func newTerminalSessionID() string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return time.Now().Format("20060102150405.000000")
	}

	return hex.EncodeToString(buf)
}

// registerTerminalSession records a newly upgraded terminal websocket so it can
// be listed and closed from the settings page.
func registerTerminalSession(ws *websocket.Conn, c *gin.Context) *terminalSession {
	session := &terminalSession{
		ID:        newTerminalSessionID(),
		Kind:      terminalKindShell,
		ClientIP:  c.ClientIP(),
		UserAgent: truncate(c.Request.UserAgent(), maxTerminalSessionUserAgent),
		CreatedAt: time.Now(),
		ws:        ws,
	}

	if principal, ok := middleware.CurrentPrincipal(c); ok {
		session.Username = principal.Username
	}

	if port := c.Query("port"); port != "" {
		session.Kind = terminalKindSerial
		session.Port = truncate(port, 64)
		session.Baud = truncate(c.Query("baud"), 16)
	}

	terminalSessions.add(session)
	return session
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}

	return value[:limit]
}

func (r *terminalSessionRegistry) add(session *terminalSession) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.sessions[session.ID] = session
}

func (r *terminalSessionRegistry) remove(id string) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	delete(r.sessions, id)
}

func (r *terminalSessionRegistry) get(id string) *terminalSession {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	return r.sessions[id]
}

func (r *terminalSessionRegistry) list() []*terminalSession {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	sessions := make([]*terminalSession, 0, len(r.sessions))
	for _, session := range r.sessions {
		sessions = append(sessions, session)
	}

	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].CreatedAt.Before(sessions[j].CreatedAt)
	})

	return sessions
}

func (s *Service) GetTerminalSessions(c *gin.Context) {
	var rsp proto.Response

	sessions := terminalSessions.list()
	infos := make([]proto.TerminalSessionInfo, 0, len(sessions))
	for _, session := range sessions {
		infos = append(infos, proto.TerminalSessionInfo{
			ID:        session.ID,
			Kind:      session.Kind,
			Username:  session.Username,
			Port:      session.Port,
			Baud:      session.Baud,
			ClientIP:  session.ClientIP,
			UserAgent: session.UserAgent,
			CreatedAt: session.CreatedAt.UnixMilli(),
		})
	}

	rsp.OkRspWithData(c, &proto.GetTerminalSessionsRsp{
		Sessions: infos,
	})
}

func (s *Service) CloseTerminalSession(c *gin.Context) {
	var rsp proto.Response

	id := c.Param("id")
	session := terminalSessions.get(id)
	if session == nil {
		rsp.ErrRsp(c, -1, "terminal session not found")
		return
	}

	terminalSessions.remove(id)
	session.close()

	rsp.OkRsp(c)
	log.Debugf("terminal session %s closed", id)
}

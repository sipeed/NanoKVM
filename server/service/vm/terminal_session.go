package vm

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/creack/pty"
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
	// terminalOutputBufferSize bounds the output kept for replaying recent
	// terminal history when a page reattaches to a detached session.
	terminalOutputBufferSize = 256 * 1024
	// terminalDetachedTimeout closes a session that no page reattached to, so
	// abandoned shells do not linger on the device forever.
	terminalDetachedTimeout = 10 * time.Minute
	// maxTerminalSessionNameLength limits the custom session name in runes.
	maxTerminalSessionNameLength = 64
	// terminalSessionTakenOverCode is an application-defined close code (4000-
	// 4999) that tells a page another page attached to its session.
	terminalSessionTakenOverCode = 4409
	// terminalSessionClosedCode tells a page its session was closed remotely
	// from the settings page.
	terminalSessionClosedCode = 4410
	// terminalSessionEndedCode tells the page the session ended on the device
	// side (shell exited or the idle timeout closed it).
	terminalSessionEndedCode = 4411
)

var errTerminalSessionClosed = errors.New("terminal session is closed")

// terminalSession owns the pty of one shell. It outlives the websocket page that
// created it: when the page disconnects the session stays detached until a new
// page reattaches (or the detach timeout expires).
type terminalSession struct {
	mutex      sync.Mutex
	writeMutex sync.Mutex

	ID        string
	Kind      string
	Username  string
	Name      string
	Port      string
	Baud      string
	ClientIP  string
	UserAgent string
	CreatedAt time.Time

	cmd  *exec.Cmd
	ptmx *os.File
	ws   *websocket.Conn

	output      []byte
	closed      bool
	closeOnce   sync.Once
	detachTimer *time.Timer
}

// attach binds a websocket page to the session, replaying the retained output.
// A second page takes the session over from the previous one.
func (s *terminalSession) attach(ws *websocket.Conn) error {
	s.writeMutex.Lock()
	defer s.writeMutex.Unlock()

	s.mutex.Lock()
	if s.closed {
		s.mutex.Unlock()
		return errTerminalSessionClosed
	}
	previous := s.ws
	s.ws = ws
	if s.detachTimer != nil {
		s.detachTimer.Stop()
		s.detachTimer = nil
	}
	replay := append([]byte(nil), s.output...)
	s.mutex.Unlock()

	if previous != nil && previous != ws {
		// Tell the page that lost the session why it was disconnected. The close
		// frame is written before closing the underlying connection so the
		// browser receives the application code instead of a bare network error.
		_ = previous.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(terminalSessionTakenOverCode, "terminal session taken over"),
			time.Now().Add(messageWait),
		)
		_ = previous.Close()
	}

	if len(replay) == 0 {
		return nil
	}

	_ = ws.SetWriteDeadline(time.Now().Add(messageWait))
	return ws.WriteMessage(websocket.BinaryMessage, replay)
}

// detach unbinds the page and starts the idle timer. It ignores a page that was
// already replaced by a takeover.
func (s *terminalSession) detach(ws *websocket.Conn) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.closed || s.ws != ws {
		return
	}
	s.ws = nil
	if s.detachTimer != nil {
		s.detachTimer.Stop()
	}
	s.detachTimer = time.AfterFunc(terminalDetachedTimeout, func() {
		// A page may have reattached after the timer fired but before this
		// callback ran; only close sessions that are still detached.
		s.mutex.Lock()
		detached := !s.closed && s.ws == nil
		s.mutex.Unlock()
		if !detached {
			return
		}

		log.Debugf("closing detached terminal session %s", s.ID)
		s.close()
	})
}

func (s *terminalSession) isAttached() bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.ws != nil
}

func (s *terminalSession) getName() string {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.Name
}

func (s *terminalSession) setName(name string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.Name = name
}

// writeOutput appends pty output to the replay buffer and forwards it to the
// attached page, if any.
func (s *terminalSession) writeOutput(data []byte) {
	s.writeMutex.Lock()
	defer s.writeMutex.Unlock()

	s.mutex.Lock()
	if s.closed {
		s.mutex.Unlock()
		return
	}
	s.output = appendBounded(s.output, data, terminalOutputBufferSize)
	ws := s.ws
	s.mutex.Unlock()

	if ws == nil {
		return
	}

	_ = ws.SetWriteDeadline(time.Now().Add(messageWait))
	if err := ws.WriteMessage(websocket.BinaryMessage, data); err != nil {
		log.Debugf("write terminal session %s output failed: %s", s.ID, err)
		s.detach(ws)
	}
}

// writeControl sends a text message to the attached page. The write mutex is
// shared with the pty output so the websocket keeps a single writer.
func (s *terminalSession) writeControl(data []byte) error {
	s.writeMutex.Lock()
	defer s.writeMutex.Unlock()

	s.mutex.Lock()
	ws := s.ws
	s.mutex.Unlock()

	if ws == nil {
		return nil
	}

	_ = ws.SetWriteDeadline(time.Now().Add(messageWait))
	return ws.WriteMessage(websocket.TextMessage, data)
}

// pty to page
func (s *terminalSession) readOutput() {
	data := make([]byte, maxMessageSize)

	for {
		n, err := s.ptmx.Read(data)
		if n > 0 {
			s.writeOutput(data[:n])
		}
		if err != nil {
			s.close()
			return
		}
	}
}

// page to pty
func (s *terminalSession) readInput(ws *websocket.Conn) {
	var zeroTime time.Time
	_ = ws.SetReadDeadline(zeroTime)

	for {
		msgType, data, err := ws.ReadMessage()
		if err != nil {
			return
		}

		// control and resize messages
		if msgType == websocket.BinaryMessage {
			var message terminalMessage
			if err := json.Unmarshal(data, &message); err == nil {
				// The page pings the session and expects a pong back, so a
				// dropped page can show how long the terminal has been silent.
				if message.Type == terminalHeartbeatType {
					if err := s.writeControl([]byte(terminalHeartbeatResponse)); err != nil {
						log.Debugf("write terminal session %s heartbeat failed: %s", s.ID, err)
						return
					}
					continue
				}

				_ = pty.Setsize(s.ptmx, &pty.Winsize{
					Rows: message.Rows,
					Cols: message.Cols,
				})
			}
			continue
		}

		if _, err := s.ptmx.Write(data); err != nil {
			log.Debugf("write terminal session %s input failed: %s", s.ID, err)
			return
		}
	}
}

func (s *terminalSession) close() {
	// A server-initiated close always carries a close code, so the page can
	// tell it apart from a network drop and show why it was disconnected.
	s.closeWithCode(terminalSessionEndedCode, "terminal session ended")
}

// closeWithCode closes the session and, when code is non-zero, tells the
// attached page why with an application-defined websocket close code.
func (s *terminalSession) closeWithCode(code int, reason string) {
	s.closeOnce.Do(func() {
		s.mutex.Lock()
		s.closed = true
		ws := s.ws
		s.ws = nil
		if s.detachTimer != nil {
			s.detachTimer.Stop()
			s.detachTimer = nil
		}
		s.mutex.Unlock()

		terminalSessions.remove(s.ID)

		if ws != nil {
			if code != 0 {
				_ = ws.WriteControl(
					websocket.CloseMessage,
					websocket.FormatCloseMessage(code, reason),
					time.Now().Add(messageWait),
				)
			}
			_ = ws.Close()
		}
		if s.ptmx != nil {
			_ = s.ptmx.Close()
		}
		if s.cmd != nil && s.cmd.Process != nil {
			_ = s.cmd.Process.Kill()
		}
		if s.cmd != nil {
			_ = s.cmd.Wait()
		}

		log.Debugf("terminal session %s closed", s.ID)
	})
}

// appendBounded appends data to buffer and keeps at most limit trailing bytes.
func appendBounded(buffer, data []byte, limit int) []byte {
	if len(data) >= limit {
		return append(buffer[:0], data[len(data)-limit:]...)
	}

	buffer = append(buffer, data...)
	if len(buffer) > limit {
		copy(buffer, buffer[len(buffer)-limit:])
		buffer = buffer[:limit]
	}

	return buffer
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

func newTerminalSession(c *gin.Context) (*terminalSession, error) {
	cmd := exec.Command("/bin/sh", "-l")
	cmd.Dir = "/root"
	ptmx, err := pty.Start(cmd)
	if err != nil {
		return nil, err
	}

	session := &terminalSession{
		ID:        newTerminalSessionID(),
		Kind:      terminalKindShell,
		ClientIP:  c.ClientIP(),
		UserAgent: truncate(c.Request.UserAgent(), maxTerminalSessionUserAgent),
		CreatedAt: time.Now(),
		cmd:       cmd,
		ptmx:      ptmx,
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
	go session.readOutput()

	return session, nil
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
			Name:      session.getName(),
			Port:      session.Port,
			Baud:      session.Baud,
			ClientIP:  session.ClientIP,
			UserAgent: session.UserAgent,
			CreatedAt: session.CreatedAt.UnixMilli(),
			Attached:  session.isAttached(),
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

	session.closeWithCode(terminalSessionClosedCode, "terminal session closed from settings")

	rsp.OkRsp(c)
	log.Debugf("terminal session %s closed", id)
}

// sanitizeTerminalSessionName trims the name, drops control characters and
// limits its length so it stays a single display line in the session list.
func sanitizeTerminalSessionName(name string) string {
	name = strings.TrimSpace(name)
	name = strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, name)

	runes := []rune(name)
	if len(runes) > maxTerminalSessionNameLength {
		return string(runes[:maxTerminalSessionNameLength])
	}

	return name
}

func (s *Service) RenameTerminalSession(c *gin.Context) {
	var req proto.RenameTerminalSessionReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	id := c.Param("id")
	session := terminalSessions.get(id)
	if session == nil {
		rsp.ErrRsp(c, -1, "terminal session not found")
		return
	}

	session.setName(sanitizeTerminalSessionName(req.Name))

	rsp.OkRsp(c)
	log.Debugf("terminal session %s renamed", id)
}

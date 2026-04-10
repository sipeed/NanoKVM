package picoclaw

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	sessionManagerOnce sync.Once
	sessionManager     *SessionManager
)

func GetSessionManager() *SessionManager {
	sessionManagerOnce.Do(func() {
		sessionManager = &SessionManager{
			sessions: make(map[string]*GatewaySession),
		}
	})

	return sessionManager
}

func (m *SessionManager) Register(sessionID string, downstream *websocket.Conn) (*GatewaySession, *PicoclawError) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existing, ok := m.sessions[sessionID]; ok {
		switch existing.State {
		case SessionStateClosing, SessionStateClosed:
			delete(m.sessions, sessionID)
		default:
			err := newPicoclawError(CodePicoclawLockHeld, "session is already connected")
			err.SessionID = sessionID
			return nil, err
		}
	}

	now := time.Now()
	session := &GatewaySession{
		SessionID:  sessionID,
		State:      SessionStateCreated,
		Downstream: downstream,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	m.sessions[sessionID] = session
	return session, nil
}

func (m *SessionManager) Get(sessionID string) (*GatewaySession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, ok := m.sessions[sessionID]
	return session, ok
}

func (m *SessionManager) SetState(sessionID string, state SessionState) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if session, ok := m.sessions[sessionID]; ok {
		session.State = state
		session.UpdatedAt = time.Now()
	}
}

func (m *SessionManager) AttachUpstream(sessionID string, upstream *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if session, ok := m.sessions[sessionID]; ok {
		session.Upstream = upstream
		session.UpdatedAt = time.Now()
	}
}

func (m *SessionManager) AttachDownstream(sessionID string, downstream *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if session, ok := m.sessions[sessionID]; ok {
		session.Downstream = downstream
		session.UpdatedAt = time.Now()
	}
}

func (m *SessionManager) Remove(sessionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, sessionID)
}

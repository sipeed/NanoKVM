package picoclaw

import (
	"sync"
	"time"
)

var (
	sessionLockOnce sync.Once
	sessionLock     *SessionLock
)

type SessionLock struct {
	mu             sync.Mutex
	ownerSessionID string
	acquiredAt     time.Time
	expiresAt      time.Time
}

func GetSessionLock() *SessionLock {
	sessionLockOnce.Do(func() {
		sessionLock = &SessionLock{}
	})

	return sessionLock
}

func (l *SessionLock) Ensure(sessionID string) *PicoclawError {
	if sessionID == "" {
		return newPicoclawError(CodeSessionIDInvalid, "invalid PicoClaw session")
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.ownerSessionID == "" || l.ownerSessionID == sessionID {
		l.ownerSessionID = sessionID
		if l.acquiredAt.IsZero() {
			l.acquiredAt = time.Now()
		}
		l.expiresAt = time.Now().Add(30 * time.Minute)
		return nil
	}

	err := newPicoclawError(CodePicoclawLockHeld, "another PicoClaw session is running")
	err.SessionID = l.ownerSessionID
	return err
}

func (l *SessionLock) Release(sessionID string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.ownerSessionID == "" {
		return true
	}
	if sessionID != "" && l.ownerSessionID != sessionID {
		return false
	}

	l.ownerSessionID = ""
	l.acquiredAt = time.Time{}
	l.expiresAt = time.Time{}
	return true
}

func (l *SessionLock) ForceTakeover(sessionID string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.ownerSessionID = sessionID
	l.acquiredAt = time.Now()
	l.expiresAt = time.Now().Add(30 * time.Minute)
}

func (l *SessionLock) Owner() string {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.ownerSessionID
}

func (l *SessionLock) BlocksManualInput() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.ownerSessionID != ""
}

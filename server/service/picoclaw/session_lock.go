package picoclaw

import (
	"sync"
	"time"
)

var (
	sessionLockOnce sync.Once
	sessionLock     *SessionLock
)

const sessionLockDuration = 30 * time.Minute

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
	_, err := l.acquire(sessionID)
	return err
}

func (l *SessionLock) AcquireTemporary(sessionID string) (bool, *PicoclawError) {
	return l.acquire(sessionID)
}

func (l *SessionLock) Renew(sessionID string) bool {
	if sessionID == "" {
		return false
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.ownerSessionID != sessionID {
		return false
	}

	l.expiresAt = time.Now().Add(sessionLockDuration)
	return true
}

func (l *SessionLock) clearExpiredLocked(now time.Time) {
	if l.ownerSessionID == "" {
		return
	}
	if l.expiresAt.IsZero() || now.Before(l.expiresAt) {
		return
	}

	l.ownerSessionID = ""
	l.acquiredAt = time.Time{}
	l.expiresAt = time.Time{}
}

func (l *SessionLock) acquire(sessionID string) (bool, *PicoclawError) {
	if sessionID == "" {
		return false, newPicoclawError(CodeSessionIDInvalid, "invalid PicoClaw session")
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	l.clearExpiredLocked(now)

	if l.ownerSessionID == "" || l.ownerSessionID == sessionID {
		acquired := l.ownerSessionID == ""
		l.ownerSessionID = sessionID
		if l.acquiredAt.IsZero() {
			l.acquiredAt = now
		}
		l.expiresAt = now.Add(sessionLockDuration)
		return acquired, nil
	}

	err := newPicoclawError(CodePicoclawLockHeld, "another PicoClaw session is running")
	err.SessionID = l.ownerSessionID
	return false, err
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

	now := time.Now()
	l.ownerSessionID = sessionID
	l.acquiredAt = now
	l.expiresAt = now.Add(sessionLockDuration)
}

func (l *SessionLock) Owner() string {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.clearExpiredLocked(time.Now())
	return l.ownerSessionID
}

func (l *SessionLock) BlocksManualInput() bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.clearExpiredLocked(time.Now())
	return l.ownerSessionID != ""
}

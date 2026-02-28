package auth

import (
	"sync"
	"time"

	"NanoKVM-Server/config"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type loginAttempt struct {
	failures   int
	lastFailed time.Time
	lockoutEnd time.Time
}

const (
	maxLoginAttemptsRecords = 3000
	cleanupInterval         = 6 * time.Hour
)

var (
	loginAttempts = make(map[string]*loginAttempt)
	loginMutex    sync.Mutex
	cleanupOnce   sync.Once
)

// startCleanupRoutine starts a background routine to clean up memory
func startCleanupRoutine() {
	conf := config.GetInstance()
	if conf.Security.LoginLockoutDuration <= 0 {
		return
	}

	go func() {
		ticker := time.NewTicker(cleanupInterval)
		for range ticker.C {
			loginMutex.Lock()
			now := time.Now()
			for ip, attempt := range loginAttempts {
				// Cleanup rules: if it has been locked and the lockout time has passed,
				// or (although not locked) it has been 30 minutes since the last failure,
				// remove this record
				if (!attempt.lockoutEnd.IsZero() && now.After(attempt.lockoutEnd)) ||
					(attempt.lockoutEnd.IsZero() && now.Sub(attempt.lastFailed) > 30*time.Minute) {
					delete(loginAttempts, ip)
				}
			}
			loginMutex.Unlock()
		}
	}()
}

// GetClientIP gets a reliable real IP
func GetClientIP(c *gin.Context) string {
	ip := c.RemoteIP()
	if ip == "" {
		ip = c.ClientIP()
	}
	return ip
}

// CheckLoginAttempt checks if a login attempt is allowed based on brute-force protection rules.
// Returning true means the IP/System is locked out, and an error string and error code are returned.
func CheckLoginAttempt(clientIP string) (bool, int, string) {
	conf := config.GetInstance()
	if conf.Security.LoginLockoutDuration <= 0 {
		return false, 0, ""
	}

	cleanupOnce.Do(startCleanupRoutine)

	loginMutex.Lock()
	defer loginMutex.Unlock()

	if attempt, exists := loginAttempts[clientIP]; exists {
		if time.Now().Before(attempt.lockoutEnd) {
			log.Debugf("login blocked for IP %s: account locked due to too many failed attempts (until %s)", clientIP, attempt.lockoutEnd)
			return true, -5, "Account locked due to too many failed attempts, please try again later"
		}

		// If lockout has elapsed, then we reset the failures and lockoutEnd.
		if !attempt.lockoutEnd.IsZero() {
			attempt.failures = 0
			attempt.lockoutEnd = time.Time{}
		}
	}

	return false, 0, ""
}

// RecordLoginFailure records a failed login attempt for the given IP address.
func RecordLoginFailure(clientIP string) (bool, int, string) {
	conf := config.GetInstance()
	if conf.Security.LoginLockoutDuration <= 0 {
		return false, 0, ""
	}

	cleanupOnce.Do(startCleanupRoutine)

	loginMutex.Lock()
	defer loginMutex.Unlock()

	attempt, exists := loginAttempts[clientIP]
	if !exists {
		// When the record pool is full, clear the records instead of global lockout to prevent DDoS
		if len(loginAttempts) >= maxLoginAttemptsRecords {
			log.Warn("Login attempt records reached maximum limit, clearing records to prevent memory overflow")
			loginAttempts = make(map[string]*loginAttempt)
		}
		attempt = &loginAttempt{}
		loginAttempts[clientIP] = attempt
	}

	now := time.Now()
	// Failure time window: if it has been a long time since the last failure
	// (e.g., beyond the lockoutDuration window), reset the failure count
	if !attempt.lastFailed.IsZero() && now.Sub(attempt.lastFailed) > time.Duration(conf.Security.LoginLockoutDuration)*time.Second {
		attempt.failures = 0
	}

	attempt.failures++
	attempt.lastFailed = now

	// Reach the failure limit, lock out
	if attempt.failures >= conf.Security.LoginMaxFailures {
		attempt.lockoutEnd = now.Add(time.Duration(conf.Security.LoginLockoutDuration) * time.Second)
		log.Debugf("login failures reached threshold for IP %s, locking out until %s", clientIP, attempt.lockoutEnd)
	}

	return false, 0, ""
}

// ClearLoginAttempt clears the failed login attempt record for an IP upon successful login.
func ClearLoginAttempt(clientIP string) {
	conf := config.GetInstance()
	if conf.Security.LoginLockoutDuration <= 0 {
		return
	}

	loginMutex.Lock()
	defer loginMutex.Unlock()

	delete(loginAttempts, clientIP)
}

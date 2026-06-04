// Package audit records user actions to a dedicated, machine-readable log file.
//
// Each action is written as one JSON object per line (JSON Lines / JSONL), e.g.
//
//	{"time":"2026-06-04T12:00:00Z","user":"alice","role":"operator","ip":"192.168.1.5","method":"POST","path":"/api/vm/gpio","action":"power / reset button","status":200,"ms":12}
//
// This format is easy to append to, easy to tail, and trivial to parse back for
// display in the web UI or with tools like `jq`.
package audit

import (
	"bufio"
	"encoding/json"
	"os"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

// Entry is a single audit record (one line in the log file).
type Entry struct {
	Time   string `json:"time"`             // RFC3339 timestamp
	User   string `json:"user"`             // username, or "-" when unknown
	Role   string `json:"role,omitempty"`   // admin / operator / viewer
	IP     string `json:"ip"`               // client IP address
	Method string `json:"method"`           // HTTP method
	Path   string `json:"path"`             // request path
	Action string `json:"action,omitempty"` // human-readable description
	Status int    `json:"status"`           // HTTP status code
	Result string `json:"result,omitempty"` // "success" / "failure" when known
	MS     int64  `json:"ms"`               // handler latency in milliseconds
}

var (
	mu       sync.Mutex
	file     *os.File
	enabled  bool
	logPath  string
	maxBytes int64
)

// Init opens (or creates) the audit log file. Call once at startup.
func Init(path string, isEnabled bool, maxSizeMB int) {
	mu.Lock()
	defer mu.Unlock()

	enabled = isEnabled
	logPath = path
	if maxSizeMB <= 0 {
		maxSizeMB = 10
	}
	maxBytes = int64(maxSizeMB) * 1024 * 1024

	if !enabled {
		log.Info("audit log disabled")
		return
	}

	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		log.Errorf("audit: failed to open log file %s: %v", path, err)
		enabled = false
		return
	}
	file = f
	log.Infof("audit log enabled -> %s", path)
}

// Enabled reports whether auditing is active.
func Enabled() bool {
	mu.Lock()
	defer mu.Unlock()
	return enabled && file != nil
}

// IsEnabled reports the configured state regardless of file handle.
func IsEnabled() bool {
	mu.Lock()
	defer mu.Unlock()
	return enabled
}

// SetEnabled turns auditing on or off at runtime. When turning on it (re)opens
// the log file; when turning off it closes the file. The path and size limit
// from the initial Init call are reused.
func SetEnabled(on bool) error {
	mu.Lock()
	defer mu.Unlock()

	if on == enabled && (!on || file != nil) {
		return nil
	}

	if !on {
		if file != nil {
			_ = file.Close()
			file = nil
		}
		enabled = false
		log.Info("audit log disabled at runtime")
		return nil
	}

	if logPath == "" {
		logPath = "/etc/kvm/audit.log"
	}
	if maxBytes == 0 {
		maxBytes = 10 * 1024 * 1024
	}

	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		log.Errorf("audit: failed to open log file %s: %v", logPath, err)
		return err
	}
	file = f
	enabled = true
	log.Infof("audit log enabled at runtime -> %s", logPath)
	return nil
}

// Write appends one entry to the audit log. Safe for concurrent use.
func Write(e Entry) {
	mu.Lock()
	defer mu.Unlock()

	if !enabled || file == nil {
		return
	}

	if e.Time == "" {
		e.Time = time.Now().UTC().Format(time.RFC3339)
	}
	if e.User == "" {
		e.User = "-"
	}

	data, err := json.Marshal(e)
	if err != nil {
		return
	}
	data = append(data, '\n')

	if _, err := file.Write(data); err != nil {
		log.Errorf("audit: write failed: %v", err)
		return
	}

	rotateIfNeeded()
}

// rotateIfNeeded keeps the file from growing without bound by keeping one
// previous generation (audit.log.1). The caller must hold mu.
func rotateIfNeeded() {
	if file == nil {
		return
	}
	info, err := file.Stat()
	if err != nil || info.Size() < maxBytes {
		return
	}

	_ = file.Close()
	_ = os.Rename(logPath, logPath+".1")

	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		log.Errorf("audit: reopen after rotate failed: %v", err)
		file = nil
		enabled = false
		return
	}
	file = f
}

// Close flushes and closes the audit log file.
func Close() {
	mu.Lock()
	defer mu.Unlock()
	if file != nil {
		_ = file.Close()
		file = nil
	}
}

// Recent returns up to limit of the most recent entries, newest first.
func Recent(limit int) ([]Entry, error) {
	mu.Lock()
	path := logPath
	mu.Unlock()

	if path == "" {
		return []Entry{}, nil
	}
	if limit <= 0 {
		limit = 200
	}

	lines := readLastLines(path, limit)
	entries := make([]Entry, 0, len(lines))
	// lines are oldest -> newest; reverse for newest-first output.
	for i := len(lines) - 1; i >= 0; i-- {
		var e Entry
		if err := json.Unmarshal([]byte(lines[i]), &e); err == nil {
			entries = append(entries, e)
		}
	}
	return entries, nil
}

// readLastLines returns the last n non-empty lines of a file using a fixed-size
// circular buffer, so memory use stays bounded regardless of file size.
func readLastLines(path string, n int) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer func() { _ = f.Close() }()

	buf := make([]string, n)
	count := 0

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}
		buf[count%n] = line
		count++
	}

	if count == 0 {
		return nil
	}
	if count < n {
		return buf[:count]
	}

	out := make([]string, 0, n)
	start := count % n
	for i := 0; i < n; i++ {
		out = append(out, buf[(start+i)%n])
	}
	return out
}

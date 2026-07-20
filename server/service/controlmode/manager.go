package controlmode

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

const ModeFile = "/etc/kvm/ai-control.mode"

const defaultActivityWaitTimeout = 30 * time.Second

type Mode string

const (
	ModeOff      Mode = "off"
	ModeMCP      Mode = "mcp"
	ModePicoclaw Mode = "picoclaw"
)

var ErrModeConflict = errors.New("AI control mode conflict")

type Status struct {
	Mode          Mode      `json:"mode"`
	Transitioning bool      `json:"transitioning"`
	LastError     string    `json:"last_error,omitempty"`
	ChangedAt     time.Time `json:"changed_at,omitempty"`
}

type Manager struct {
	transitionMu        sync.Mutex
	activity            activityGate
	mu                  sync.Mutex
	path                string
	defaultMode         Mode
	activityWaitTimeout time.Duration
	loaded              bool
	mode                Mode
	modeFileExists      bool
	modeFileSize        int64
	modeFileModTime     time.Time
	transitioning       bool
	lastError           string
	changedAt           time.Time
}

var (
	defaultManagerOnce sync.Once
	defaultManager     *Manager
)

func GetManager() *Manager {
	defaultManagerOnce.Do(func() {
		defaultManager = NewManager(ModeFile, ModePicoclaw)
	})
	return defaultManager
}

func NewManager(path string, defaultMode Mode) *Manager {
	if !validMode(defaultMode) {
		defaultMode = ModeOff
	}
	return &Manager{
		path:                path,
		defaultMode:         defaultMode,
		activityWaitTimeout: defaultActivityWaitTimeout,
	}
}

func (m *Manager) Status() (Status, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.loadLocked(); err != nil {
		return Status{Mode: ModeOff, Transitioning: m.transitioning, LastError: err.Error(), ChangedAt: m.changedAt}, err
	}
	return m.statusLocked(), nil
}

func (m *Manager) Current() Mode {
	status, err := m.Status()
	if err != nil {
		return ModeOff
	}
	return status.Mode
}

func (m *Manager) RequireWrite(expected Mode) error {
	status, err := m.Status()
	if err != nil {
		return err
	}
	if status.Transitioning || status.Mode != expected {
		return fmt.Errorf("%w: current=%s expected=%s", ErrModeConflict, status.Mode, expected)
	}
	return nil
}

func (m *Manager) Require(expected Mode) error {
	return m.RequireWrite(expected)
}

func (m *Manager) RequireMode(expected Mode) error {
	status, err := m.Status()
	if err != nil {
		return err
	}
	if status.Mode != expected {
		return fmt.Errorf("%w: current=%s expected=%s", ErrModeConflict, status.Mode, expected)
	}
	return nil
}

func (m *Manager) AcquireWrite(expected Mode) (func(), error) {
	if err := m.RequireWrite(expected); err != nil {
		return nil, err
	}
	release := m.activity.acquireShared()
	if err := m.RequireWrite(expected); err != nil {
		release()
		return nil, err
	}
	return release, nil
}

func (m *Manager) Acquire(expected Mode) (func(), error) {
	return m.AcquireWrite(expected)
}

// AcquireStable holds the current control mode stable while a non-AI input
// operation is in flight. Mode transitions take the exclusive side of the
// activity gate, so they wait until the returned release function is called.
func (m *Manager) AcquireStable() (Status, func(), error) {
	status, err := m.Status()
	if err != nil {
		return Status{Mode: ModeOff}, nil, err
	}
	if status.Transitioning {
		return status, nil, fmt.Errorf("%w: control mode is transitioning", ErrModeConflict)
	}

	release := m.activity.acquireShared()
	status, err = m.Status()
	if err != nil {
		release()
		return Status{Mode: ModeOff}, nil, err
	}
	if status.Transitioning {
		release()
		return status, nil, fmt.Errorf("%w: control mode is transitioning", ErrModeConflict)
	}

	return status, release, nil
}

func (m *Manager) Switch(next Mode, preempt func() error) error {
	return m.SwitchWithCleanup(next, preempt, nil)
}

func (m *Manager) SwitchWithCleanup(next Mode, preempt func() error, cleanup func() error) error {
	startedAt := time.Now()
	timings := log.Fields{
		"to": string(next),
	}

	m.transitionMu.Lock()
	defer m.transitionMu.Unlock()

	stageStartedAt := time.Now()
	status, err := m.Status()
	timings["load_status_ms"] = elapsedMilliseconds(stageStartedAt)
	if err != nil {
		logModeSwitchFailure("AI control mode switch failed while loading status", timings, err, startedAt)
		return err
	}
	timings["from"] = string(status.Mode)
	if !validMode(next) {
		err := fmt.Errorf("invalid AI control mode %q", next)
		logModeSwitchFailure("AI control mode switch rejected invalid target", timings, err, startedAt)
		return err
	}
	if status.Mode == next {
		timings["total_ms"] = elapsedMilliseconds(startedAt)
		log.WithFields(timings).Debug("AI control mode switch skipped")
		return nil
	}

	m.setTransitioning(true)
	defer m.setTransitioning(false)
	if preempt != nil {
		stageStartedAt = time.Now()
		if err := callModeTransitionHook(preempt); err != nil {
			timings["preempt_ms"] = elapsedMilliseconds(stageStartedAt)
			m.setLastError(err)
			logModeSwitchFailure("AI control mode switch preempt failed", timings, err, startedAt)
			return err
		}
		timings["preempt_ms"] = elapsedMilliseconds(stageStartedAt)
	}

	stageStartedAt = time.Now()
	releaseActivity, err := m.acquireExclusiveActivity()
	timings["activity_wait_ms"] = elapsedMilliseconds(stageStartedAt)
	if err != nil {
		m.setLastError(err)
		logModeSwitchFailure("AI control mode switch activity wait failed", timings, err, startedAt)
		return err
	}
	defer releaseActivity()

	if cleanup != nil {
		stageStartedAt = time.Now()
		if err := callModeTransitionHook(cleanup); err != nil {
			timings["cleanup_ms"] = elapsedMilliseconds(stageStartedAt)
			if rollbackErr := m.save(ModeOff); rollbackErr != nil {
				err = errors.Join(err, rollbackErr)
			}
			m.setLastError(err)
			logModeSwitchFailure("AI control mode switch cleanup failed", timings, err, startedAt)
			return err
		}
		timings["cleanup_ms"] = elapsedMilliseconds(stageStartedAt)
	}

	stageStartedAt = time.Now()
	if err := m.save(next); err != nil {
		timings["save_mode_ms"] = elapsedMilliseconds(stageStartedAt)
		m.setLastError(err)
		logModeSwitchFailure("AI control mode switch save failed", timings, err, startedAt)
		return err
	}
	timings["save_mode_ms"] = elapsedMilliseconds(stageStartedAt)
	m.setLastError(nil)
	timings["total_ms"] = elapsedMilliseconds(startedAt)
	log.WithFields(timings).Info("AI control mode switch completed")
	return nil
}

func (m *Manager) SwitchIf(expected Mode, next Mode, preempt func() error) (bool, error) {
	return m.SwitchIfWithCleanup(expected, next, preempt, nil)
}

func (m *Manager) SwitchIfWithCleanup(expected Mode, next Mode, preempt func() error, cleanup func() error) (bool, error) {
	startedAt := time.Now()
	timings := log.Fields{
		"expected": string(expected),
		"to":       string(next),
	}

	if !validMode(expected) || !validMode(next) {
		err := fmt.Errorf("invalid AI control mode transition %q -> %q", expected, next)
		logModeSwitchFailure("conditional AI control mode switch rejected invalid transition", timings, err, startedAt)
		return false, err
	}

	m.transitionMu.Lock()
	defer m.transitionMu.Unlock()

	stageStartedAt := time.Now()
	status, err := m.Status()
	timings["load_status_ms"] = elapsedMilliseconds(stageStartedAt)
	if err != nil {
		logModeSwitchFailure("conditional AI control mode switch failed while loading status", timings, err, startedAt)
		return false, err
	}
	timings["from"] = string(status.Mode)
	if status.Mode != expected {
		timings["matched"] = false
		timings["total_ms"] = elapsedMilliseconds(startedAt)
		log.WithFields(timings).Debug("conditional AI control mode switch skipped")
		return false, nil
	}
	if status.Mode == next {
		timings["matched"] = true
		timings["total_ms"] = elapsedMilliseconds(startedAt)
		log.WithFields(timings).Debug("conditional AI control mode switch already satisfied")
		return true, nil
	}

	m.setTransitioning(true)
	defer m.setTransitioning(false)
	if preempt != nil {
		stageStartedAt = time.Now()
		if err := callModeTransitionHook(preempt); err != nil {
			timings["preempt_ms"] = elapsedMilliseconds(stageStartedAt)
			m.setLastError(err)
			logModeSwitchFailure("conditional AI control mode switch preempt failed", timings, err, startedAt)
			return false, err
		}
		timings["preempt_ms"] = elapsedMilliseconds(stageStartedAt)
	}

	stageStartedAt = time.Now()
	releaseActivity, err := m.acquireExclusiveActivity()
	timings["activity_wait_ms"] = elapsedMilliseconds(stageStartedAt)
	if err != nil {
		m.setLastError(err)
		logModeSwitchFailure("conditional AI control mode switch activity wait failed", timings, err, startedAt)
		return false, err
	}
	defer releaseActivity()

	if cleanup != nil {
		stageStartedAt = time.Now()
		if err := callModeTransitionHook(cleanup); err != nil {
			timings["cleanup_ms"] = elapsedMilliseconds(stageStartedAt)
			if rollbackErr := m.save(ModeOff); rollbackErr != nil {
				err = errors.Join(err, rollbackErr)
			}
			m.setLastError(err)
			logModeSwitchFailure("conditional AI control mode switch cleanup failed", timings, err, startedAt)
			return false, err
		}
		timings["cleanup_ms"] = elapsedMilliseconds(stageStartedAt)
	}

	stageStartedAt = time.Now()
	if err := m.save(next); err != nil {
		timings["save_mode_ms"] = elapsedMilliseconds(stageStartedAt)
		m.setLastError(err)
		logModeSwitchFailure("conditional AI control mode switch save failed", timings, err, startedAt)
		return false, err
	}
	timings["save_mode_ms"] = elapsedMilliseconds(stageStartedAt)
	m.setLastError(nil)
	timings["matched"] = true
	timings["total_ms"] = elapsedMilliseconds(startedAt)
	log.WithFields(timings).Info("conditional AI control mode switch completed")
	return true, nil
}

func (m *Manager) SwitchToMCP(preempt func() error) error {
	return m.Switch(ModeMCP, preempt)
}

func (m *Manager) SwitchToMCPWithPreempt(preempt func() error) error {
	return m.Switch(ModeMCP, preempt)
}

func (m *Manager) SwitchToPicoclaw(preempt func() error) error {
	return m.Switch(ModePicoclaw, preempt)
}

func (m *Manager) SwitchToPicoclawWithPreempt(preempt func() error) error {
	return m.Switch(ModePicoclaw, preempt)
}

func (m *Manager) SwitchOff(preempt func() error) error {
	return m.Switch(ModeOff, preempt)
}

func (m *Manager) SwitchOffIf(expected Mode, preempt func() error) (bool, error) {
	return m.SwitchIf(expected, ModeOff, preempt)
}

func (m *Manager) SwitchOffIfWithPreempt(expected Mode, preempt func() error) (bool, error) {
	return m.SwitchIf(expected, ModeOff, preempt)
}

func callModeTransitionHook(hook func() error) (err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = fmt.Errorf("panic: %v", recovered)
		}
	}()
	return hook()
}

func (m *Manager) setTransitioning(transitioning bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.transitioning = transitioning
}

func (m *Manager) setLastError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if err == nil {
		m.lastError = ""
		return
	}
	m.lastError = err.Error()
}

func (m *Manager) statusLocked() Status {
	return Status{
		Mode:          m.mode,
		Transitioning: m.transitioning,
		LastError:     m.lastError,
		ChangedAt:     m.changedAt,
	}
}

func (m *Manager) acquireExclusiveActivity() (func(), error) {
	timeout := m.activityWaitTimeout
	if timeout <= 0 {
		timeout = defaultActivityWaitTimeout
	}

	release, err := m.activity.acquireExclusive(timeout)
	if err != nil {
		return nil, fmt.Errorf("wait for active control operations: %w", err)
	}
	return release, nil
}

func (m *Manager) save(mode Mode) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.saveLocked(mode)
}

func (m *Manager) loadLocked() error {
	if m.loaded && m.transitioning {
		return nil
	}

	info, statErr := os.Stat(m.path)
	if m.loaded && statErr == nil && m.modeFileExists && info.Size() == m.modeFileSize && info.ModTime().Equal(m.modeFileModTime) {
		return nil
	}
	if m.loaded && errors.Is(statErr, os.ErrNotExist) && !m.modeFileExists {
		return nil
	}
	if statErr != nil && !errors.Is(statErr, os.ErrNotExist) {
		return fmt.Errorf("stat AI control mode: %w", statErr)
	}

	data, err := os.ReadFile(m.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			m.mode = m.defaultMode
			m.loaded = true
			m.modeFileExists = false
			m.modeFileSize = 0
			m.modeFileModTime = time.Time{}
			if m.changedAt.IsZero() {
				m.changedAt = time.Now()
			}
			return nil
		}
		return fmt.Errorf("read AI control mode: %w", err)
	}

	mode := Mode(strings.TrimSpace(string(data)))
	if !validMode(mode) {
		m.mode = ModeOff
		m.loaded = true
		m.lastError = fmt.Sprintf("invalid AI control mode %q", strings.TrimSpace(string(data)))
		m.cacheModeFileInfoLocked(info, data)
		return nil
	}
	m.mode = mode
	m.loaded = true
	m.lastError = ""
	m.cacheModeFileInfoLocked(info, data)
	return nil
}

func (m *Manager) saveLocked(mode Mode) error {
	if !validMode(mode) {
		return fmt.Errorf("invalid AI control mode %q", mode)
	}

	dir := filepath.Dir(m.path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create AI control mode directory: %w", err)
	}

	tmp, err := os.CreateTemp(dir, ".ai-control.mode.*")
	if err != nil {
		return fmt.Errorf("create temporary AI control mode: %w", err)
	}
	tmpPath := tmp.Name()
	defer func() { _ = os.Remove(tmpPath) }()

	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("set AI control mode permissions: %w", err)
	}
	if _, err := tmp.WriteString(string(mode) + "\n"); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write AI control mode: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("sync AI control mode: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close AI control mode: %w", err)
	}
	if err := os.Rename(tmpPath, m.path); err != nil {
		return fmt.Errorf("replace AI control mode: %w", err)
	}
	m.mode = mode
	m.loaded = true
	if info, err := os.Stat(m.path); err == nil {
		m.cacheModeFileInfoLocked(info, []byte(string(mode)+"\n"))
	} else {
		m.modeFileExists = true
		m.modeFileSize = int64(len(string(mode) + "\n"))
		m.modeFileModTime = time.Now()
	}
	m.changedAt = time.Now()

	directory, err := os.Open(dir)
	if err == nil {
		if syncErr := directory.Sync(); syncErr != nil {
			_ = directory.Close()
			return fmt.Errorf("sync AI control mode directory: %w", syncErr)
		}
		_ = directory.Close()
	}

	return nil
}

func (m *Manager) cacheModeFileInfoLocked(info os.FileInfo, data []byte) {
	m.modeFileExists = true
	if info != nil {
		m.modeFileSize = info.Size()
		m.modeFileModTime = info.ModTime()
		if m.changedAt.IsZero() || info.ModTime().After(m.changedAt) {
			m.changedAt = info.ModTime()
		}
		return
	}
	m.modeFileSize = int64(len(data))
	m.modeFileModTime = time.Now()
	m.changedAt = m.modeFileModTime
}

func validMode(mode Mode) bool {
	switch mode {
	case ModeOff, ModeMCP, ModePicoclaw:
		return true
	default:
		return false
	}
}

func elapsedMilliseconds(startedAt time.Time) int64 {
	return time.Since(startedAt).Milliseconds()
}

func logModeSwitchFailure(message string, fields log.Fields, err error, startedAt time.Time) {
	fields["total_ms"] = elapsedMilliseconds(startedAt)
	log.WithFields(fields).WithError(err).Warn(message)
}

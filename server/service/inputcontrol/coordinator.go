package inputcontrol

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"NanoKVM-Server/service/controlmode"
)

var (
	ErrMCPBusy             = errors.New("MCP remote control is busy")
	ErrManualControlActive = errors.New("manual control is active")
	ErrManualInputBlocked  = errors.New("manual input is blocked")
	ErrManualPreempted     = errors.New("MCP operation was preempted by manual input")
	ErrMCPModeChanged      = errors.New("MCP control mode changed")
)

const defaultManualCooldown = 2 * time.Second

type OperationKind uint8

const (
	OperationHID OperationKind = iota
	OperationReadOnly
)

type ManualReportKind uint8

const (
	ManualKeyboard ManualReportKind = iota
	ManualRelativeMouse
	ManualAbsoluteMouse
)

type activeOperation struct {
	id     uint64
	kind   OperationKind
	cancel context.CancelCauseFunc
	done   chan struct{}
}

type Coordinator struct {
	mu             sync.Mutex
	manualWriteMu  sync.Mutex
	active         *activeOperation
	nextID         uint64
	manualSessions int
	manualUntil    time.Time
	manualCooldown time.Duration
	now            func() time.Time
}

type ManualSession struct {
	coordinator *Coordinator
	control     *controlmode.Manager

	mu                sync.Mutex
	active            bool
	closed            bool
	generation        uint64
	pending           int
	keyboardHeld      bool
	relativeMouseHeld bool
	absoluteMouseHeld bool
	cooldownOnIdle    bool
	releaseControl    func()
}

type ManualReservation struct {
	once          sync.Once
	session       *ManualSession
	generation    uint64
	kind          ManualReportKind
	held          bool
	startCooldown bool
}

var defaultCoordinator = newCoordinator(defaultManualCooldown, time.Now)

func newCoordinator(cooldown time.Duration, now func() time.Time) *Coordinator {
	if cooldown < 0 {
		cooldown = 0
	}
	if now == nil {
		now = time.Now
	}
	return &Coordinator{manualCooldown: cooldown, now: now}
}

func GetCoordinator() *Coordinator {
	return defaultCoordinator
}

func NewManualSession(control *controlmode.Manager, coordinator *Coordinator) *ManualSession {
	if control == nil {
		control = controlmode.GetManager()
	}
	if coordinator == nil {
		coordinator = GetCoordinator()
	}
	return &ManualSession{control: control, coordinator: coordinator}
}

func (c *Coordinator) BeginMCP(parent context.Context, kind OperationKind) (context.Context, func(), error) {
	if parent == nil {
		parent = context.Background()
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.active != nil {
		return nil, nil, ErrMCPBusy
	}
	if kind == OperationHID && (c.manualSessions > 0 || c.currentTime().Before(c.manualUntil)) {
		return nil, nil, ErrManualControlActive
	}

	c.nextID++
	id := c.nextID
	ctx, cancel := context.WithCancelCause(parent)
	operation := &activeOperation{
		id:     id,
		kind:   kind,
		cancel: cancel,
		done:   make(chan struct{}),
	}
	c.active = operation

	var once sync.Once
	release := func() {
		once.Do(func() {
			cancel(context.Canceled)
			c.mu.Lock()
			if c.active != nil && c.active.id == id {
				c.active = nil
				close(operation.done)
			}
			c.mu.Unlock()
		})
	}
	return ctx, release, nil
}

// BeginBackground reserves the HID lane for a best-effort background action,
// such as the mouse jiggler. Callers should skip the action when it returns a
// busy error rather than delaying manual or MCP input.
func (c *Coordinator) BeginBackground(parent context.Context) (context.Context, func(), error) {
	return c.BeginMCP(parent, OperationHID)
}

func (c *Coordinator) CancelMCP() {
	c.CancelMCPWithCause(ErrMCPModeChanged)
}

func (c *Coordinator) CancelMCPWithCause(cause error) {
	if cause == nil {
		cause = context.Canceled
	}
	c.mu.Lock()
	operation := c.active
	c.mu.Unlock()
	if operation != nil {
		operation.cancel(cause)
	}
}

func (c *Coordinator) beginManual(ctx context.Context) error {
	if ctx == nil {
		ctx = context.Background()
	}

	c.mu.Lock()
	c.manualSessions++
	operation := c.active
	if operation != nil && operation.kind == OperationHID {
		operation.cancel(ErrManualPreempted)
	} else {
		operation = nil
	}
	c.mu.Unlock()

	if operation == nil {
		return nil
	}

	select {
	case <-operation.done:
		return nil
	case <-ctx.Done():
		c.endManual(false)
		return context.Cause(ctx)
	}
}

func (c *Coordinator) endManual(startCooldown bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.manualSessions > 0 {
		c.manualSessions--
	}
	if startCooldown && c.manualSessions == 0 {
		c.manualUntil = c.currentTime().Add(c.cooldown())
	}
}

func (c *Coordinator) currentTime() time.Time {
	if c.now == nil {
		return time.Now()
	}
	return c.now()
}

func (c *Coordinator) cooldown() time.Duration {
	if c.manualCooldown <= 0 {
		return defaultManualCooldown
	}
	return c.manualCooldown
}

func (c *Coordinator) executeManual(write func() error) error {
	if write == nil {
		return nil
	}
	c.manualWriteMu.Lock()
	defer c.manualWriteMu.Unlock()
	return write()
}

func (s *ManualSession) Reserve(
	ctx context.Context,
	kind ManualReportKind,
	held bool,
	allow func(controlmode.Mode) bool,
) (*ManualReservation, error) {
	return s.reserve(ctx, kind, held, true, allow)
}

func (s *ManualSession) ReserveWithCooldown(
	ctx context.Context,
	kind ManualReportKind,
	held bool,
	startCooldown bool,
	allow func(controlmode.Mode) bool,
) (*ManualReservation, error) {
	return s.reserve(ctx, kind, held, startCooldown, allow)
}

func (s *ManualSession) reserve(
	ctx context.Context,
	kind ManualReportKind,
	held bool,
	startCooldown bool,
	allow func(controlmode.Mode) bool,
) (*ManualReservation, error) {
	if s == nil || s.coordinator == nil || s.control == nil {
		return nil, fmt.Errorf("manual input coordinator is unavailable")
	}

	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return nil, fmt.Errorf("manual input session is closed")
	}
	if s.active {
		status, err := s.control.Status()
		if err != nil {
			s.mu.Unlock()
			return nil, err
		}
		allowed := !status.Transitioning && (allow == nil || allow(status.Mode))
		if !allowed && !s.isReleaseReportLocked(kind, held) {
			s.mu.Unlock()
			return nil, ErrManualInputBlocked
		}
		s.pending++
		startCooldown = startCooldown || s.isReleaseReportLocked(kind, held)
		reservation := &ManualReservation{
			session: s, generation: s.generation, kind: kind, held: held, startCooldown: startCooldown,
		}
		s.mu.Unlock()
		return reservation, nil
	}
	s.mu.Unlock()

	status, releaseControl, err := s.control.AcquireStable()
	if err != nil {
		return nil, err
	}
	if allow != nil && !allow(status.Mode) {
		releaseControl()
		return nil, ErrManualInputBlocked
	}
	if err := s.coordinator.beginManual(ctx); err != nil {
		releaseControl()
		return nil, err
	}

	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		s.coordinator.endManual(false)
		releaseControl()
		return nil, fmt.Errorf("manual input session is closed")
	}
	if s.active {
		// Reserve calls are serialized for a WebSocket client, but keep this path
		// safe for callers that share a session concurrently.
		s.pending++
		startCooldown = startCooldown || s.isReleaseReportLocked(kind, held)
		reservation := &ManualReservation{
			session: s, generation: s.generation, kind: kind, held: held, startCooldown: startCooldown,
		}
		s.mu.Unlock()
		s.coordinator.endManual(false)
		releaseControl()
		return reservation, nil
	}

	s.active = true
	s.generation++
	s.pending = 1
	s.releaseControl = releaseControl
	reservation := &ManualReservation{
		session: s, generation: s.generation, kind: kind, held: held, startCooldown: startCooldown,
	}
	s.mu.Unlock()
	return reservation, nil
}

func (s *ManualSession) isReleaseReportLocked(kind ManualReportKind, held bool) bool {
	if held {
		return false
	}
	switch kind {
	case ManualKeyboard:
		return s.keyboardHeld
	case ManualRelativeMouse, ManualAbsoluteMouse:
		return s.relativeMouseHeld || s.absoluteMouseHeld
	default:
		return false
	}
}

func (r *ManualReservation) Complete(success bool) {
	if r == nil || r.session == nil {
		return
	}
	r.once.Do(func() {
		r.session.complete(r.generation, r.kind, r.held, success, r.startCooldown)
	})
}

func (s *ManualSession) Execute(write func() error) error {
	if s == nil || s.coordinator == nil {
		return fmt.Errorf("manual input coordinator is unavailable")
	}
	return s.coordinator.executeManual(write)
}

func (s *ManualSession) Reset(kind ManualReportKind) {
	if s == nil {
		return
	}

	s.mu.Lock()
	if !s.active {
		s.mu.Unlock()
		return
	}
	switch kind {
	case ManualKeyboard:
		s.keyboardHeld = false
	case ManualRelativeMouse:
		s.relativeMouseHeld = false
	case ManualAbsoluteMouse:
		s.absoluteMouseHeld = false
	}
	releaseControl, end, _ := s.finishIfIdleLocked()
	s.mu.Unlock()
	s.finish(releaseControl, end, true)
}

func (s *ManualSession) Close() {
	if s == nil {
		return
	}

	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return
	}
	s.closed = true
	s.pending = 0
	s.keyboardHeld = false
	s.relativeMouseHeld = false
	s.absoluteMouseHeld = false
	s.cooldownOnIdle = false
	releaseControl := s.releaseControl
	end := s.active
	s.active = false
	s.releaseControl = nil
	s.generation++
	s.mu.Unlock()
	s.finish(releaseControl, end, true)
}

func (s *ManualSession) complete(generation uint64, kind ManualReportKind, held bool, success bool, startCooldown bool) {
	s.mu.Lock()
	if !s.active || generation != s.generation {
		s.mu.Unlock()
		return
	}
	if s.pending > 0 {
		s.pending--
	}
	if startCooldown {
		s.cooldownOnIdle = true
	}
	if success {
		switch kind {
		case ManualKeyboard:
			s.keyboardHeld = held
		case ManualRelativeMouse:
			s.relativeMouseHeld = held
		case ManualAbsoluteMouse:
			s.absoluteMouseHeld = held
		}
	} else {
		s.keyboardHeld = false
		s.relativeMouseHeld = false
		s.absoluteMouseHeld = false
	}
	releaseControl, end, startCooldown := s.finishIfIdleLocked()
	s.mu.Unlock()
	s.finish(releaseControl, end, startCooldown)
}

func (s *ManualSession) finishIfIdleLocked() (func(), bool, bool) {
	if !s.active || s.pending > 0 || s.keyboardHeld || s.relativeMouseHeld || s.absoluteMouseHeld {
		return nil, false, false
	}
	releaseControl := s.releaseControl
	startCooldown := s.cooldownOnIdle
	s.active = false
	s.releaseControl = nil
	s.cooldownOnIdle = false
	return releaseControl, true, startCooldown
}

func (s *ManualSession) finish(releaseControl func(), end bool, startCooldown bool) {
	if !end {
		return
	}
	if releaseControl != nil {
		releaseControl()
	}
	s.coordinator.endManual(startCooldown)
}

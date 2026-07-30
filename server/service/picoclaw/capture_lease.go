package picoclaw

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"NanoKVM-Server/service/vm"
)

const defaultTaskCaptureLeaseDuration = 2 * time.Minute
const maxTaskCaptureLeaseDuration = 30 * time.Minute

func (s *Service) acquireCaptureLease(ctx context.Context) (func(), func() bool, error) {
	if s != nil && s.acquireHDMIForRead != nil {
		return s.acquireHDMIForRead(ctx)
	}
	return vm.AcquireHdmiCaptureLeaseForRead(ctx)
}

func (s *Service) activateTaskCaptureLease(sessionID string, taskID string, duration time.Duration) {
	if s == nil || sessionID == "" {
		return
	}
	if duration <= 0 {
		duration = defaultTaskCaptureLeaseDuration
	}
	if duration > maxTaskCaptureLeaseDuration {
		duration = maxTaskCaptureLeaseDuration
	}

	key := taskCaptureLeaseKey(sessionID, taskID)
	s.captureLeaseMu.Lock()
	defer s.captureLeaseMu.Unlock()
	if s.captureLeases == nil {
		s.captureLeases = make(map[string]func())
	}
	if s.captureLeaseTimers == nil {
		s.captureLeaseTimers = make(map[string]*time.Timer)
	}

	if s.captureLeases[key] == nil {
		if s.acquireHDMILease != nil {
			s.captureLeases[key] = s.acquireHDMILease()
		} else {
			s.captureLeases[key] = vm.AcquireHdmiCaptureLease()
		}
	}
	if timer := s.captureLeaseTimers[key]; timer != nil {
		timer.Stop()
	}
	s.captureLeaseTimers[key] = time.AfterFunc(duration, func() {
		s.releaseCaptureLease(key)
	})
}

func (s *Service) updateTaskCaptureLease(source string, sessionID string, data []byte) {
	if s == nil || sessionID == "" || len(data) == 0 {
		return
	}

	var message struct {
		ID      string `json:"id"`
		Type    string `json:"type"`
		Payload struct {
			MaxRuntimeMS int `json:"max_runtime_ms"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(data, &message); err != nil {
		return
	}

	switch {
	case source == "downstream" && message.Type == "message.send":
		duration := defaultTaskCaptureLeaseDuration
		if message.Payload.MaxRuntimeMS > 0 {
			maxMilliseconds := int(maxTaskCaptureLeaseDuration / time.Millisecond)
			duration = time.Duration(min(message.Payload.MaxRuntimeMS, maxMilliseconds)) * time.Millisecond
		}
		s.activateTaskCaptureLease(sessionID, message.ID, duration)
	case source == "downstream" && message.Type == "message.cancel":
		if message.ID == "" {
			s.releaseCaptureLeasesForSession(sessionID)
			return
		}
		s.releaseTaskCaptureLease(sessionID, message.ID)
	case source == "upstream" && (message.Type == "typing.stop" || message.Type == "message.create" || message.Type == "message.update" || message.Type == "error"):
		if message.ID == "" {
			s.releaseCaptureLeasesForSession(sessionID)
			return
		}
		s.releaseTaskCaptureLease(sessionID, message.ID)
	}
}

func taskCaptureLeaseKey(sessionID string, taskID string) string {
	if taskID == "" {
		taskID = "default"
	}
	return "task:" + sessionID + ":" + taskID
}

func (s *Service) releaseTaskCaptureLease(sessionID string, taskID string) {
	if sessionID == "" {
		return
	}
	s.releaseCaptureLease(taskCaptureLeaseKey(sessionID, taskID))
}

func (s *Service) releaseCaptureLeasesForSession(sessionID string) {
	if s == nil || sessionID == "" {
		return
	}
	prefix := "task:" + sessionID + ":"
	s.captureLeaseMu.Lock()
	keys := make([]string, 0, len(s.captureLeases))
	for key := range s.captureLeases {
		if strings.HasPrefix(key, prefix) {
			keys = append(keys, key)
		}
	}
	s.captureLeaseMu.Unlock()
	for _, key := range keys {
		s.releaseCaptureLease(key)
	}
}

func (s *Service) releaseCaptureLease(key string) {
	if s == nil || key == "" {
		return
	}
	s.captureLeaseMu.Lock()
	release := s.captureLeases[key]
	delete(s.captureLeases, key)
	if timer := s.captureLeaseTimers[key]; timer != nil {
		timer.Stop()
		delete(s.captureLeaseTimers, key)
	}
	s.captureLeaseMu.Unlock()

	if release != nil {
		release()
	}
}

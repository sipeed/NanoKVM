package picoclaw

import (
	"time"

	"NanoKVM-Server/service/controlmode"
)

func (s *Service) PublishControlModeChanged(status controlmode.Status) {
	s.PublishControlModeChangedFrom(status, "")
}

func (s *Service) PublishControlModeChangedFrom(status controlmode.Status, source string) {
	if s == nil {
		return
	}
	s.ensureDependencies()

	payload := controlModeChangedPayload(status, source)
	message := picoGatewayMessage{
		Type:      "control.mode_changed",
		Timestamp: time.Now().UnixMilli(),
		Payload:   payload,
	}
	cfg := s.config.Get()
	for _, session := range GetSessionManager().Snapshot() {
		if session == nil || session.State != SessionStateActive || session.Downstream == nil {
			continue
		}
		_ = session.writeDownstreamJSON(cfg, message)
	}
}

func controlModeChangedPayload(status controlmode.Status, source string) map[string]any {
	payload := map[string]any{
		"mode":          string(status.Mode),
		"transitioning": status.Transitioning,
		"can_control":   status.Mode == controlmode.ModePicoclaw && !status.Transitioning,
	}
	if status.LastError != "" {
		payload["last_error"] = status.LastError
	}
	if !status.ChangedAt.IsZero() {
		payload["changed_at"] = status.ChangedAt
	}
	if source != "" {
		payload["source"] = source
	}
	return payload
}

package picoclaw

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type picoGatewayMessage struct {
	Type      string         `json:"type"`
	ID        string         `json:"id,omitempty"`
	SessionID string         `json:"session_id,omitempty"`
	Timestamp int64          `json:"timestamp,omitempty"`
	Payload   map[string]any `json:"payload,omitempty"`
}

func newPicoGatewayMessage(sessionID string, payload map[string]any) picoGatewayMessage {
	return picoGatewayMessage{
		Type:      "message.send",
		ID:        uuid.NewString(),
		SessionID: sessionID,
		Timestamp: time.Now().UnixMilli(),
		Payload:   payload,
	}
}

func newPicoGatewayObservationMessage(sessionID string, payload map[string]any) picoGatewayMessage {
	return picoGatewayMessage{
		Type:      "observation",
		ID:        uuid.NewString(),
		SessionID: sessionID,
		Timestamp: time.Now().UnixMilli(),
		Payload:   payload,
	}
}

func (session *GatewaySession) writeUpstreamJSON(cfg Config, value any) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return session.writeUpstreamMessage(cfg, websocket.TextMessage, raw)
}

func (session *GatewaySession) writeDownstreamJSON(cfg Config, value any) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return session.writeDownstreamMessage(cfg, websocket.TextMessage, raw)
}

func (session *GatewaySession) writeUpstreamMessage(cfg Config, messageType int, data []byte) error {
	if session == nil || session.Upstream == nil {
		return fmt.Errorf("upstream connection is unavailable")
	}

	session.upstreamWriteMu.Lock()
	defer session.upstreamWriteMu.Unlock()

	_ = session.Upstream.SetWriteDeadline(gatewayWriteDeadline(cfg))
	return session.Upstream.WriteMessage(messageType, data)
}

func (session *GatewaySession) writeDownstreamMessage(cfg Config, messageType int, data []byte) error {
	if session == nil || session.Downstream == nil {
		return fmt.Errorf("downstream connection is unavailable")
	}

	session.downstreamWriteMu.Lock()
	defer session.downstreamWriteMu.Unlock()

	_ = session.Downstream.SetWriteDeadline(gatewayWriteDeadline(cfg))
	return session.Downstream.WriteMessage(messageType, data)
}

func gatewayWriteDeadline(cfg Config) time.Time {
	timeout := time.Duration(cfg.WriteTimeoutMs) * time.Millisecond
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	return time.Now().Add(timeout)
}

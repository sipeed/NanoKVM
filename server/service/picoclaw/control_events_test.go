package picoclaw

import (
	"testing"
	"time"

	"NanoKVM-Server/service/controlmode"
)

func TestControlModeChangedPayloadIncludesControlMetadata(t *testing.T) {
	changedAt := time.Now().UTC()
	payload := controlModeChangedPayload(controlmode.Status{
		Mode:          controlmode.ModeMCP,
		Transitioning: true,
		LastError:     "switch failed",
		ChangedAt:     changedAt,
	}, "mcp_config")

	if payload["mode"] != string(controlmode.ModeMCP) {
		t.Fatalf("mode = %v, want %q", payload["mode"], controlmode.ModeMCP)
	}
	if payload["transitioning"] != true {
		t.Fatalf("transitioning = %v, want true", payload["transitioning"])
	}
	if payload["can_control"] != false {
		t.Fatalf("can_control = %v, want false", payload["can_control"])
	}
	if payload["last_error"] != "switch failed" {
		t.Fatalf("last_error = %v, want switch failed", payload["last_error"])
	}
	if payload["changed_at"] != changedAt {
		t.Fatalf("changed_at = %v, want %v", payload["changed_at"], changedAt)
	}
	if payload["source"] != "mcp_config" {
		t.Fatalf("source = %v, want mcp_config", payload["source"])
	}
}

func TestControlModeChangedPayloadAllowsPicoclawControlWhenStable(t *testing.T) {
	payload := controlModeChangedPayload(controlmode.Status{
		Mode: controlmode.ModePicoclaw,
	}, "")

	if payload["can_control"] != true {
		t.Fatalf("can_control = %v, want true", payload["can_control"])
	}
	if _, ok := payload["source"]; ok {
		t.Fatalf("source = %v, want omitted", payload["source"])
	}
}

package hid

import (
	"testing"
	"time"
)

func TestReportLengthValidation(t *testing.T) {
	h := &Hid{}
	if err := h.WriteKeyboardReport(make([]byte, 7)); err == nil {
		t.Fatal("expected keyboard length error")
	}
	if err := h.WriteRelativeMouseReport(make([]byte, 5)); err == nil {
		t.Fatal("expected relative mouse length error")
	}
	if err := h.WriteAbsoluteMouseReport(make([]byte, 7)); err == nil {
		t.Fatal("expected absolute mouse length error")
	}
}

func TestPasteDurationLeavesModeSwitchMargin(t *testing.T) {
	if maxPasteDuration >= 30*time.Second {
		t.Fatalf("maxPasteDuration = %s, want below 30s mode switch wait budget", maxPasteDuration)
	}
	if got := time.Duration(maxPasteContentRunes) * defaultPasteDelay; got > maxPasteDuration {
		t.Fatalf("max paste content duration = %s, want <= %s", got, maxPasteDuration)
	}
}

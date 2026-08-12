package mcpservice

import "testing"

func TestBuildKeyComboReport(t *testing.T) {
	report, err := buildKeyComboReport([]string{"ControlLeft", "AltLeft", "Delete"})
	if err != nil {
		t.Fatal(err)
	}
	if report[0] != 0x05 || report[2] != 0x4c {
		t.Fatalf("unexpected combo report: %v", report)
	}
	if _, err := buildKeyComboReport([]string{"Unknown"}); err == nil {
		t.Fatal("expected unknown key error")
	}
	if _, err := buildKeyComboReport([]string{"KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG"}); err == nil {
		t.Fatal("expected six-key limit error")
	}
}

func TestBuildTypeReportsReturnsSkippedRunes(t *testing.T) {
	reports, skipped := buildTypeReports("A界")
	if len(reports) != 2 || string(skipped) != "界" {
		t.Fatalf("reports=%d skipped=%q", len(reports), string(skipped))
	}
	if reports[0][0] != 2 || reports[0][2] != 4 || string(reports[1]) != string(keyUpReport) {
		t.Fatalf("unexpected reports: %v", reports)
	}
}

func TestSupportedKeyNamesMatchKeyboardDescriptor(t *testing.T) {
	for name, code := range keyCodeMap {
		if code > 0x65 {
			t.Fatalf("key %s uses unsupported descriptor code %#x", name, code)
		}
	}
}

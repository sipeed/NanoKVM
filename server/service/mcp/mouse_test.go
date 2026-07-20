package mcpservice

import "testing"

func TestAbsoluteCoordinateUsesNanoKVMRange(t *testing.T) {
	tests := []struct {
		value float64
		want  uint16
	}{
		{-1, 1},
		{0, 1},
		{0.5, 0x4000},
		{1, 0x8000},
		{2, 0x8000},
	}
	for _, test := range tests {
		if got := absoluteCoordinate(test.value); got != test.want {
			t.Fatalf("absoluteCoordinate(%v) = %#x, want %#x", test.value, got, test.want)
		}
	}
}

func TestAbsoluteReportIsSixBytes(t *testing.T) {
	report := buildAbsolutePointerReport(0x1234, 0x5678, 1, -2)
	want := []byte{1, 0x34, 0x12, 0x78, 0x56, 0xfe}
	if string(report) != string(want) {
		t.Fatalf("report = %v, want %v", report, want)
	}
}

func TestRelativeMovementSplitsReports(t *testing.T) {
	reports, err := buildRelativeMoveReports(300, -300)
	if err != nil {
		t.Fatal(err)
	}
	if len(reports) != 3 {
		t.Fatalf("report count = %d, want 3", len(reports))
	}
	if reports[0][1] != byte(int8(127)) || int8(reports[0][2]) != -127 {
		t.Fatalf("first report = %v", reports[0])
	}
	if _, err := buildRelativeMoveReports(127*(maxRelativeMouseReports+1), 0); err == nil {
		t.Fatal("expected oversized movement error")
	}
}

func TestUnsupportedAuxiliaryMouseButtons(t *testing.T) {
	for _, button := range []string{"back", "forward"} {
		if _, err := mouseButtonBit(button); err == nil {
			t.Fatalf("button %q should be rejected", button)
		}
	}
}

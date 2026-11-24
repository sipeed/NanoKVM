// Package lontium reads the receiver's versioned, coherent kernel snapshot.
// It does not access I2C, control power, or infer timings from capture failures.
package lontium

import (
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"strconv"
	"strings"
)

const StatusPath = "/proc/lontium/status"
const maxStatusSize = 4096

type Signal string

const (
	Unknown  Signal = "unknown"
	Off      Signal = "off"
	Absent   Signal = "absent"
	Unstable Signal = "unstable"
	Valid    Signal = "valid"
	Error    Signal = "error"
)

type Size struct {
	Valid  bool   `json:"valid"`
	Width  uint32 `json:"width"`
	Height uint32 `json:"height"`
}

type CSITiming struct {
	Size
	HTotal       uint32 `json:"htotal"`
	VTotal       uint32 `json:"vtotal"`
	PixelClockHz uint64 `json:"pixelclockHz"`
	FPSMillihz   uint32 `json:"fpsMillihz"` // Zero means unknown.
}

type Status struct {
	ABI          uint32    `json:"abi"`
	Sequence     uint64    `json:"sequence"`
	UpdatedNS    uint64    `json:"updatedNs"` // CLOCK_BOOTTIME, not a wall-clock time.
	Chip         string    `json:"chip"`
	Power        string    `json:"power"` // Requested state; reset may be unwired.
	PowerControl bool      `json:"powerControl"`
	Signal       Signal    `json:"signal"`
	Error        int32     `json:"error"`
	Input        Size      `json:"input"`
	CSI          CSITiming `json:"csi"`
}

// HasVideo reports confirmed CSI timing, independently of SDK capture health.
func (s Status) HasVideo() bool {
	return s.Power == "on" && s.Signal == Valid && s.Error == 0 && s.CSI.Valid
}

// VideoSize adapts the raw ABI to capture consumers with 16-bit arguments.
// Hardware capture limits belong to the capture library, not this reader.
func (s Status) VideoSize() (uint16, uint16) {
	if !s.HasVideo() || s.CSI.Width > math.MaxUint16 || s.CSI.Height > math.MaxUint16 {
		return 0, 0
	}
	return uint16(s.CSI.Width), uint16(s.CSI.Height)
}

func ReadStatus() (Status, error) { return Read(StatusPath) }

// Read opens a fresh descriptor and drains one snapshot through EOF.
// Every failure returns a zero Status, so callers cannot retain stale timings.
func Read(path string) (Status, error) {
	f, err := os.Open(path)
	if err != nil {
		return Status{}, err
	}
	defer f.Close()
	data, err := io.ReadAll(io.LimitReader(f, maxStatusSize+1))
	if err != nil {
		return Status{}, err
	}
	return Parse(string(data))
}

// Parse follows ABI 1's validation rules shared with lontium_hdmi.hpp.
// Unknown additive fields are allowed; missing and duplicate fields are not.
func Parse(text string) (Status, error) {
	if len(text) > maxStatusSize || strings.ContainsRune(text, '\x00') {
		return Status{}, errors.New("invalid lontium snapshot size or NUL byte")
	}
	fields := make(map[string]string)
	for _, token := range strings.FieldsFunc(text, func(r rune) bool {
		return r == ' ' || r == '\t' || r == '\r' || r == '\n' || r == '\v' || r == '\f'
	}) {
		key, value, ok := strings.Cut(token, "=")
		if !ok || key == "" || value == "" || strings.Contains(value, "=") {
			return Status{}, errors.New("invalid lontium field")
		}
		if _, exists := fields[key]; exists {
			return Status{}, fmt.Errorf("duplicate lontium field %s", key)
		}
		fields[key] = value
	}
	var s Status
	if err := number(fields, "abi", &s.ABI); err != nil {
		return Status{}, err
	}
	if s.ABI != 1 {
		return Status{}, fmt.Errorf("unsupported lontium ABI %d", s.ABI)
	}
	// Keep the complete required-field set even when no video is present.
	numbers := []error{
		number(fields, "sequence", &s.Sequence), number(fields, "updated_ns", &s.UpdatedNS),
		boolean(fields, "power_control", &s.PowerControl),
		boolean(fields, "input_valid", &s.Input.Valid),
		number(fields, "input_width", &s.Input.Width), number(fields, "input_height", &s.Input.Height),
		boolean(fields, "csi_valid", &s.CSI.Valid),
		number(fields, "csi_width", &s.CSI.Width), number(fields, "csi_height", &s.CSI.Height),
		number(fields, "csi_htotal", &s.CSI.HTotal), number(fields, "csi_vtotal", &s.CSI.VTotal),
		number(fields, "csi_pixelclock_hz", &s.CSI.PixelClockHz), number(fields, "csi_fps_millihz", &s.CSI.FPSMillihz),
	}
	for _, err := range numbers {
		if err != nil {
			return Status{}, err
		}
	}
	s.Chip, s.Power, s.Signal = fields["chip"], fields["power"], Signal(fields["signal"])
	if s.Chip == "" || (s.Power != "on" && s.Power != "off") {
		return Status{}, errors.New("invalid lontium chip or power")
	}
	switch s.Signal {
	case Unknown, Off, Absent, Unstable, Valid, Error:
	default:
		return Status{}, errors.New("invalid lontium signal")
	}
	errText := fields["error"]
	if errText != "0" {
		if !strings.HasPrefix(errText, "-") {
			return Status{}, errors.New("invalid lontium error")
		}
		magnitude, err := unsigned(strings.TrimPrefix(errText, "-"), uint64(math.MaxInt32)+1)
		if err != nil {
			return Status{}, fmt.Errorf("invalid lontium error: %w", err)
		}
		s.Error = int32(-int64(magnitude))
	}
	validSize := func(size Size) bool {
		if size.Valid {
			return size.Width != 0 && size.Height != 0
		}
		return size.Width == 0 && size.Height == 0
	}
	if !validSize(s.Input) || !validSize(s.CSI.Size) || (s.Power == "off") != (s.Signal == Off) {
		return Status{}, errors.New("inconsistent lontium dimensions or power")
	}
	if s.Signal == Valid {
		if !s.CSI.Valid || s.Error != 0 {
			return Status{}, errors.New("invalid lontium video timing")
		}
	} else if s.Input.Valid || s.CSI.Valid || s.CSI.HTotal != 0 || s.CSI.VTotal != 0 || s.CSI.PixelClockHz != 0 || s.CSI.FPSMillihz != 0 {
		return Status{}, errors.New("inactive lontium signal carries timing")
	}
	return s, nil
}

func unsigned(text string, limit uint64) (uint64, error) {
	if text == "" {
		return 0, errors.New("missing decimal value")
	}
	for _, digit := range text {
		if digit < '0' || digit > '9' {
			return 0, errors.New("invalid unsigned decimal")
		}
	}
	u, err := strconv.ParseUint(text, 10, 64)
	if err != nil || u > limit {
		return 0, errors.New("unsigned decimal overflow")
	}
	return u, nil
}

func number[T ~uint32 | ~uint64](fields map[string]string, key string, target *T) error {
	u, err := unsigned(fields[key], uint64(^T(0)))
	if err != nil {
		return fmt.Errorf("invalid lontium %s: %w", key, err)
	}
	*target = T(u)
	return nil
}

func boolean(fields map[string]string, key string, target *bool) error {
	u, err := unsigned(fields[key], 1)
	if err != nil {
		return fmt.Errorf("invalid lontium %s: %w", key, err)
	}
	*target = u != 0
	return nil
}

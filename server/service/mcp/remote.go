package mcpservice

import (
	"context"
	"fmt"
	"sync"
	"time"

	"NanoKVM-Server/service/hid"
)

type HIDWriter interface {
	WriteKeyboardReport([]byte) error
	WriteRelativeMouseReport([]byte) error
	WriteAbsoluteMouseReport([]byte) error
}

type Remote struct {
	hid   HIDWriter
	hidMu sync.Mutex
}

func NewRemote() *Remote {
	return &Remote{hid: hid.GetHid()}
}

func newRemoteWithHID(writer HIDWriter) *Remote {
	return &Remote{hid: writer}
}

func (r *Remote) TypeText(ctx context.Context, text string, delay time.Duration) ([]rune, error) {
	reports, skipped := buildTypeReports(text)
	r.hidMu.Lock()
	defer r.hidMu.Unlock()

	keyDown := false
	for index, report := range reports {
		if err := contextError(ctx); err != nil {
			if keyDown {
				_ = r.hid.WriteKeyboardReport(keyUpReport)
			}
			return skipped, err
		}
		if err := r.hid.WriteKeyboardReport(report); err != nil {
			_ = r.hid.WriteKeyboardReport(keyUpReport)
			return skipped, err
		}
		keyDown = index%2 == 0
		if !keyDown && index+1 < len(reports) {
			if err := sleepContext(ctx, delay); err != nil {
				return skipped, err
			}
		}
	}
	return skipped, nil
}

func (r *Remote) PressKeys(ctx context.Context, keys []string, hold time.Duration) error {
	report, err := buildKeyComboReport(keys)
	if err != nil {
		return err
	}

	r.hidMu.Lock()
	defer r.hidMu.Unlock()

	if err := contextError(ctx); err != nil {
		return err
	}
	if err := r.hid.WriteKeyboardReport(report); err != nil {
		_ = r.hid.WriteKeyboardReport(keyUpReport)
		return err
	}
	if err := sleepContext(ctx, hold); err != nil {
		_ = r.hid.WriteKeyboardReport(keyUpReport)
		return err
	}
	return r.hid.WriteKeyboardReport(keyUpReport)
}

func (r *Remote) MoveAbsolute(ctx context.Context, x float64, y float64) error {
	if x < 0 || x > 1 || y < 0 || y > 1 {
		return fmt.Errorf("absolute coordinates must be between 0 and 1")
	}
	report := buildAbsolutePointerReport(absoluteCoordinate(x), absoluteCoordinate(y), 0, 0)
	r.hidMu.Lock()
	defer r.hidMu.Unlock()
	if err := contextError(ctx); err != nil {
		return err
	}
	return r.hid.WriteAbsoluteMouseReport(report)
}

func (r *Remote) TouchAbsoluteButton(ctx context.Context, x float64, y float64, button string, hold time.Duration) error {
	if x < 0 || x > 1 || y < 0 || y > 1 {
		return fmt.Errorf("absolute coordinates must be between 0 and 1")
	}
	bit, err := mouseButtonBit(button)
	if err != nil {
		return err
	}
	hidX := absoluteCoordinate(x)
	hidY := absoluteCoordinate(y)
	release := buildAbsolutePointerReport(hidX, hidY, 0, 0)

	r.hidMu.Lock()
	defer r.hidMu.Unlock()

	if err := contextError(ctx); err != nil {
		return err
	}
	if err := r.hid.WriteAbsoluteMouseReport(buildAbsolutePointerReport(hidX, hidY, bit, 0)); err != nil {
		_ = r.hid.WriteAbsoluteMouseReport(release)
		return err
	}
	if err := sleepContext(ctx, hold); err != nil {
		_ = r.hid.WriteAbsoluteMouseReport(release)
		return err
	}
	return r.hid.WriteAbsoluteMouseReport(release)
}

func (r *Remote) MoveRelative(ctx context.Context, deltaX int, deltaY int) error {
	reports, err := buildRelativeMoveReports(deltaX, deltaY)
	if err != nil {
		return err
	}

	r.hidMu.Lock()
	defer r.hidMu.Unlock()
	for _, report := range reports {
		if err := contextError(ctx); err != nil {
			_ = r.hid.WriteRelativeMouseReport(buildRelativeMouseReport(0, 0, 0, 0))
			return err
		}
		if err := r.hid.WriteRelativeMouseReport(report); err != nil {
			_ = r.hid.WriteRelativeMouseReport(buildRelativeMouseReport(0, 0, 0, 0))
			return err
		}
	}
	return nil
}

func (r *Remote) Click(ctx context.Context, button string, clicks int, delay time.Duration) error {
	bit, err := mouseButtonBit(button)
	if err != nil {
		return err
	}
	clicks = clampInt(clicks, 1, 5)
	release := buildRelativeMouseReport(0, 0, 0, 0)

	r.hidMu.Lock()
	defer r.hidMu.Unlock()
	for i := 0; i < clicks; i++ {
		if err := contextError(ctx); err != nil {
			_ = r.hid.WriteRelativeMouseReport(release)
			return err
		}
		if err := r.hid.WriteRelativeMouseReport(buildRelativeMouseReport(0, 0, bit, 0)); err != nil {
			_ = r.hid.WriteRelativeMouseReport(release)
			return err
		}
		if err := sleepContext(ctx, delay); err != nil {
			_ = r.hid.WriteRelativeMouseReport(release)
			return err
		}
		if err := r.hid.WriteRelativeMouseReport(release); err != nil {
			_ = r.hid.WriteRelativeMouseReport(release)
			return err
		}
		if i+1 < clicks {
			if err := sleepContext(ctx, delay); err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *Remote) Scroll(ctx context.Context, deltaY int) error {
	if reportsForDelta(deltaY) > maxRelativeMouseReports {
		return fmt.Errorf("scroll exceeds %d reports", maxRelativeMouseReports)
	}

	x := absoluteCoordinate(0.5)
	y := absoluteCoordinate(0.5)
	release := buildAbsolutePointerReport(x, y, 0, 0)

	r.hidMu.Lock()
	defer r.hidMu.Unlock()
	for deltaY != 0 {
		if err := contextError(ctx); err != nil {
			_ = r.hid.WriteAbsoluteMouseReport(release)
			return err
		}
		wheel := clampInt(deltaY, -127, 127)
		if err := r.hid.WriteAbsoluteMouseReport(buildAbsolutePointerReport(x, y, 0, wheel)); err != nil {
			_ = r.hid.WriteAbsoluteMouseReport(release)
			return err
		}
		if err := r.hid.WriteAbsoluteMouseReport(release); err != nil {
			_ = r.hid.WriteAbsoluteMouseReport(release)
			return err
		}
		deltaY -= wheel
	}
	return nil
}

func sleepContext(ctx context.Context, delay time.Duration) error {
	if delay <= 0 {
		return contextError(ctx)
	}
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return context.Cause(ctx)
	case <-timer.C:
		return nil
	}
}

func contextError(ctx context.Context) error {
	if ctx == nil {
		return nil
	}
	select {
	case <-ctx.Done():
		return context.Cause(ctx)
	default:
		return nil
	}
}

package picoclaw

import (
	"bytes"
	"encoding/json"
	"math"
	"strings"
	"time"

	"NanoKVM-Server/service/hid"

	"github.com/gin-gonic/gin"
)

const (
	defaultClickHold  = 40 * time.Millisecond
	defaultKeyDelay   = 30 * time.Millisecond
	defaultDragSteps  = 10
	defaultScrollStep = 20 * time.Millisecond
)

func (s *Service) Actions(c *gin.Context) {
	sessionID, sessionErr := s.requireSessionID(c)
	if sessionErr != nil {
		writePicoclawError(c, sessionErr)
		return
	}

	actions, actionErr := normalizeActions(c)
	if actionErr != nil {
		writePicoclawError(c, actionErr)
		return
	}

	result, execErr := s.executeActions(sessionID, actions)
	if execErr != nil {
		writePicoclawError(c, execErr)
		return
	}

	writeSuccess(c, result)
}

func normalizeActions(c *gin.Context) ([]Action, *PicoclawError) {
	body := bytes.NewBuffer(nil)
	if _, err := body.ReadFrom(c.Request.Body); err != nil {
		return nil, newPicoclawError(CodeInvalidAction, "failed to read action payload")
	}

	raw := body.Bytes()
	if len(raw) == 0 {
		return nil, newPicoclawError(CodeInvalidAction, "empty action payload")
	}

	var batch ActionBatch
	if err := json.Unmarshal(raw, &batch); err == nil && len(batch.Actions) > 0 {
		return batch.Actions, nil
	}

	var action Action
	if err := json.Unmarshal(raw, &action); err != nil || action.Action == "" {
		return nil, newPicoclawError(CodeInvalidAction, "invalid action payload")
	}

	return []Action{action}, nil
}

func (s *Service) executeActions(sessionID string, actions []Action) (result ActionResult, err *PicoclawError) {
	startedAt := time.Now()
	if len(actions) == 0 {
		return ActionResult{}, newPicoclawError(CodeInvalidAction, "empty actions")
	}

	defer func() {
		if err != nil {
			s.releaseAllHIDState()
		}
	}()

	totalWrites := 0
	for idx, action := range actions {
		if lockErr := s.lock.Ensure(sessionID); lockErr != nil {
			lockErr.Index = &idx
			return ActionResult{}, lockErr
		}

		writes, execErr := s.executeAction(action)
		if execErr != nil {
			execErr.Index = &idx
			return ActionResult{}, execErr
		}
		totalWrites += writes
	}

	result = ActionResult{
		Action:          actions[0].Action,
		DurationMs:      time.Since(startedAt).Milliseconds(),
		HIDWrites:       totalWrites,
		ExecutedActions: len(actions),
	}
	if len(actions) > 1 {
		result.Action = "batch"
	}

	return result, nil
}

func (s *Service) executeAction(action Action) (int, *PicoclawError) {
	switch strings.ToLower(strings.TrimSpace(action.Action)) {
	case "click":
		x, y, err := normalizedPoint(action.X, action.Y)
		if err != nil {
			return 0, err
		}
		button, err := mouseButton(action.Button)
		if err != nil {
			return 0, err
		}

		writes := 0
		writes += s.sendMouseMoveWithButton(x, y, 0x00, 0)
		writes += s.sendMousePress(x, y, button)
		time.Sleep(defaultClickHold)
		writes += s.sendMouseRelease(x, y)
		return writes, nil

	case "move":
		x, y, err := normalizedPoint(action.X, action.Y)
		if err != nil {
			return 0, err
		}
		return s.sendMouseMoveWithButton(x, y, 0x00, 0), nil

	case "wait":
		if action.DurationMs < 0 {
			return 0, newPicoclawError(CodeInvalidAction, "wait duration must be >= 0")
		}
		time.Sleep(time.Duration(action.DurationMs) * time.Millisecond)
		return 0, nil

	case "drag":
		fromX, fromY, err := normalizedNestedPoint(action.From)
		if err != nil {
			return 0, err
		}
		toX, toY, err := normalizedNestedPoint(action.To)
		if err != nil {
			return 0, err
		}
		button, err := mouseButton(action.Button)
		if err != nil {
			return 0, err
		}

		writes := 0
		writes += s.sendMouseMoveWithButton(fromX, fromY, 0x00, 0)
		writes += s.sendMousePress(fromX, fromY, button)
		for step := 1; step <= defaultDragSteps; step++ {
			ratio := float64(step) / float64(defaultDragSteps)
			x := fromX + (toX-fromX)*ratio
			y := fromY + (toY-fromY)*ratio
			writes += s.sendMouseMoveWithButton(x, y, button, 0)
		}
		writes += s.sendMouseRelease(toX, toY)
		return writes, nil

	case "scroll":
		x, y := 0.5, 0.5
		if action.X != nil || action.Y != nil {
			var err *PicoclawError
			x, y, err = normalizedPoint(action.X, action.Y)
			if err != nil {
				return 0, err
			}
		}

		amount := action.Amount
		if amount == 0 {
			amount = 1
		}
		if amount < 0 {
			return 0, newPicoclawError(CodeInvalidAction, "scroll amount must be > 0")
		}

		wheel := 1
		switch strings.ToLower(strings.TrimSpace(action.Direction)) {
		case "", "up":
			wheel = 1
		case "down":
			wheel = -1
		default:
			return 0, newPicoclawError(CodeInvalidAction, "invalid scroll direction")
		}

		writes := 0
		for range amount {
			writes += s.sendMouseMoveWithButton(x, y, 0x00, wheel)
			writes += s.sendMouseMoveWithButton(x, y, 0x00, 0)
			time.Sleep(defaultScrollStep)
		}
		return writes, nil

	case "type":
		if action.Text == "" {
			return 0, newPicoclawError(CodeInvalidAction, "type requires text")
		}
		charMap := hid.GetCharMap("")
		writes := 0
		for _, char := range action.Text {
			key, ok := charMap[char]
			if !ok {
				return 0, newPicoclawError(CodeInvalidAction, "unsupported character in type action")
			}

			writes += s.sendKeyboardReport([]byte{byte(key.Modifiers), 0x00, byte(key.Code), 0x00, 0x00, 0x00, 0x00, 0x00})
			writes += s.sendKeyboardReport([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
			time.Sleep(defaultKeyDelay)
		}
		return writes, nil

	case "hotkey":
		report, err := buildHotkeyReport([]string(action.Keys))
		if err != nil {
			return 0, err
		}
		writes := 0
		writes += s.sendKeyboardReport(report)
		time.Sleep(defaultClickHold)
		writes += s.sendKeyboardReport([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
		return writes, nil
	}

	return 0, newPicoclawError(CodeInvalidAction, "unknown or invalid action")
}

func toAbsoluteHidCoord(normalized float64) uint16 {
	if normalized < 0 {
		normalized = 0
	}
	if normalized > 1 {
		normalized = 1
	}
	return uint16(math.Floor(0x7FFF*normalized)) + 1
}

func (s *Service) sendMousePress(x float64, y float64, button byte) int {
	return s.sendMouseMoveWithButton(x, y, button, 0)
}

func (s *Service) sendMouseRelease(x float64, y float64) int {
	return s.sendMouseMoveWithButton(x, y, 0x00, 0)
}

func (s *Service) sendMouseMoveWithButton(x float64, y float64, buttons byte, wheel int) int {
	absoluteX := toAbsoluteHidCoord(x)
	absoluteY := toAbsoluteHidCoord(y)

	report := []byte{
		buttons,
		byte(absoluteX & 0xff),
		byte(absoluteX >> 8),
		byte(absoluteY & 0xff),
		byte(absoluteY >> 8),
		byte(int8(wheel)),
	}
	s.hid.WriteHid2(report)
	return 1
}

func (s *Service) sendKeyboardReport(report []byte) int {
	s.hid.WriteHid0(report)
	return 1
}

func normalizedPoint(x *float64, y *float64) (float64, float64, *PicoclawError) {
	if x == nil || y == nil {
		return 0, 0, newPicoclawError(CodeInvalidAction, "action requires x and y")
	}
	if *x < 0 || *x > 1 || *y < 0 || *y > 1 {
		return 0, 0, newPicoclawError(CodeInvalidAction, "coordinates must be within [0,1]")
	}
	return *x, *y, nil
}

func normalizedNestedPoint(point *Point) (float64, float64, *PicoclawError) {
	if point == nil {
		return 0, 0, newPicoclawError(CodeInvalidAction, "action requires point coordinates")
	}
	return normalizedPoint(point.X, point.Y)
}

func mouseButton(button string) (byte, *PicoclawError) {
	switch strings.ToLower(strings.TrimSpace(button)) {
	case "", "left":
		return 1 << 0, nil
	case "right":
		return 1 << 1, nil
	case "middle":
		return 1 << 2, nil
	case "back":
		return 1 << 3, nil
	case "forward":
		return 1 << 4, nil
	default:
		return 0, newPicoclawError(CodeInvalidAction, "invalid mouse button")
	}
}

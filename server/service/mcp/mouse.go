package mcpservice

import (
	"fmt"
	"math"
)

const (
	maxRelativeMouseReports = 1024
	maxRelativeMouseDelta   = 127 * maxRelativeMouseReports
)

func absoluteCoordinate(value float64) uint16 {
	value = math.Max(0, math.Min(1, value))
	return uint16(math.Floor(0x7fff*value)) + 1
}

func buildAbsolutePointerReport(x uint16, y uint16, buttons byte, wheel int) []byte {
	return []byte{
		buttons,
		byte(x), byte(x >> 8),
		byte(y), byte(y >> 8),
		byte(int8(clampInt(wheel, -127, 127))),
	}
}

func buildRelativeMouseReport(deltaX int, deltaY int, buttons byte, wheel int) []byte {
	return []byte{
		buttons,
		byte(int8(clampInt(deltaX, -127, 127))),
		byte(int8(clampInt(deltaY, -127, 127))),
		byte(int8(clampInt(wheel, -127, 127))),
	}
}

func buildRelativeMoveReports(deltaX int, deltaY int) ([][]byte, error) {
	if relativeReportCount(deltaX, deltaY) > maxRelativeMouseReports {
		return nil, fmt.Errorf("relative movement exceeds %d reports", maxRelativeMouseReports)
	}

	reports := make([][]byte, 0)
	for deltaX != 0 || deltaY != 0 {
		x := clampInt(deltaX, -127, 127)
		y := clampInt(deltaY, -127, 127)
		reports = append(reports, buildRelativeMouseReport(x, y, 0, 0))
		deltaX -= x
		deltaY -= y
	}
	return reports, nil
}

func mouseButtonBit(button string) (byte, error) {
	switch button {
	case "left":
		return 1 << 0, nil
	case "right":
		return 1 << 1, nil
	case "middle":
		return 1 << 2, nil
	default:
		return 0, fmt.Errorf("unknown mouse button: %s", button)
	}
}

func clampInt(value int, minValue int, maxValue int) int {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

func relativeReportCount(deltaX int, deltaY int) int {
	xReports := reportsForDelta(deltaX)
	yReports := reportsForDelta(deltaY)
	if xReports > yReports {
		return xReports
	}
	return yReports
}

func reportsForDelta(delta int) int {
	value := int64(delta)
	if value == 0 {
		return 0
	}
	if value < 0 {
		return int((-(value + 1))/127 + 1)
	}
	return int((value-1)/127 + 1)
}

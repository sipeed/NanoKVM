package hid

import (
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"
)

type reportWriter interface {
	WriteKeyboardReport([]byte) error
	WriteRelativeMouseReport([]byte) error
	WriteAbsoluteMouseReport([]byte) error
}

func ReleaseAllHIDState() error {
	return releaseAllHIDState(GetHid())
}

func ReleaseAllHIDStateBestEffort() error {
	return releaseAllHIDStateBestEffort(GetHid())
}

func releaseAllHIDStateBestEffort(writer reportWriter) error {
	if err := releaseAllHIDState(writer); err != nil {
		log.Warnf("failed to release HID state during control switch: %v", err)
	}
	return nil
}

func releaseAllHIDState(writer reportWriter) error {
	if writer == nil {
		return fmt.Errorf("HID writer is unavailable")
	}

	var errs []error
	if err := writer.WriteKeyboardReport(keyboardReleaseReport()); err != nil {
		errs = append(errs, fmt.Errorf("release keyboard: %w", err))
	}
	if err := writer.WriteRelativeMouseReport(relativeMouseReleaseReport()); err != nil {
		errs = append(errs, fmt.Errorf("release relative mouse: %w", err))
	}
	if err := writer.WriteAbsoluteMouseReport(absoluteMouseReleaseReport(nil)); err != nil {
		errs = append(errs, fmt.Errorf("release absolute mouse: %w", err))
	}

	return errors.Join(errs...)
}

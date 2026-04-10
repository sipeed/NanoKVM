package picoclaw

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	CodePicoclawLockHeld         = "AI_LOCK_HELD"
	CodeScreenshotFailed   = "SCREENSHOT_FAILED"
	CodeScreenshotNoSignal = "SCREENSHOT_NO_SIGNAL"
	CodeHIDWriteFailed     = "HID_WRITE_FAILED"
	CodeInvalidAction      = "INVALID_ACTION"
	CodeRuntimeUnavailable = "RUNTIME_UNAVAILABLE"
	CodeRuntimeStartFailed = "RUNTIME_START_FAILED"
	CodeSessionIDMissing   = "SESSION_ID_MISSING"
	CodeSessionIDInvalid   = "SESSION_ID_INVALID"
)

type PicoclawError struct {
	StatusCode int
	Code       string
	Message    string
	SessionID  string
	Index      *int
}

func (e *PicoclawError) Error() string {
	return e.Code + ": " + e.Message
}

func newPicoclawError(code string, message string) *PicoclawError {
	return &PicoclawError{
		StatusCode: http.StatusOK,
		Code:       code,
		Message:    message,
	}
}

func writeSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "success",
		"data": data,
	})
}

func writePicoclawError(c *gin.Context, err *PicoclawError) {
	if err == nil {
		return
	}

	payload := gin.H{
		"code":    err.Code,
		"message": err.Message,
	}
	if err.SessionID != "" {
		payload["session_id"] = err.SessionID
	}
	if err.Index != nil {
		payload["index"] = *err.Index
	}

	statusCode := err.StatusCode
	if statusCode == 0 {
		statusCode = http.StatusOK
	}

	c.JSON(statusCode, payload)
}

package picoclaw

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	defaultImagePrompt = "Describe the image briefly."
)

func (s *Service) LoadImage(c *gin.Context) {
	var req LoadImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid load image payload"))
		return
	}

	sessionID, session, sessionErr := s.requireActiveGatewaySession(c)
	if sessionErr != nil {
		writePicoclawError(c, sessionErr)
		return
	}

	sourcePath, pathErr := normalizeLoadImagePath(req.Path)
	if pathErr != nil {
		writePicoclawError(c, pathErr)
		return
	}

	instruction := buildLoadImageInstruction(sourcePath, req.Prompt)
	message := newPicoGatewayMessage(sessionID, map[string]any{
		"content": instruction,
	})
	if err := session.writeUpstreamJSON(s.config.Get(), message); err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to deliver image instruction to picoclaw"))
		return
	}

	writeSuccess(c, gin.H{
		"accepted":      true,
		"session_id":    sessionID,
		"message_id":    message.ID,
		"path":          sourcePath,
		"user_prompt":   normalizeImagePrompt(req.Prompt),
		"instructed_at": time.Now(),
	})
}

func (s *Service) requireActiveGatewaySession(c *gin.Context) (string, *GatewaySession, *PicoclawError) {
	sessionID := strings.TrimSpace(c.GetHeader(sessionIDHeader))
	if sessionID == "" {
		sessionID = strings.TrimSpace(s.lock.Owner())
	}
	if sessionID == "" {
		return "", nil, newPicoclawError(CodeSessionIDMissing, "missing X-PicoClaw-Session-ID")
	}

	session, ok := GetSessionManager().Get(sessionID)
	if !ok || session == nil {
		err := newPicoclawError(CodeRuntimeUnavailable, "picoclaw session is not connected")
		err.SessionID = sessionID
		return "", nil, err
	}
	if session.State != SessionStateActive || session.Upstream == nil {
		err := newPicoclawError(CodeRuntimeUnavailable, "picoclaw session is not active")
		err.SessionID = sessionID
		return "", nil, err
	}

	return sessionID, session, nil
}

func normalizeLoadImagePath(sourcePath string) (string, *PicoclawError) {
	sourcePath = strings.TrimSpace(sourcePath)
	if sourcePath == "" {
		return "", newPicoclawError(CodeInvalidAction, "image path is required")
	}

	return sourcePath, nil
}

func buildLoadImageInstruction(sourcePath string, prompt string) string {
	argsJSON, _ := json.Marshal(map[string]string{"path": sourcePath})
	return fmt.Sprintf(
		"Call `load_image` first with this exact argument object:\n```json\n%s\n```\n\nDo not ask the user to re-upload the image. Do not modify the path. Do not use `read_file` or any other tool to inspect this image directly.\n\nAfter `load_image` succeeds, treat the loaded image as the current task input and continue with this request:\n%s",
		string(argsJSON),
		normalizeImagePrompt(prompt),
	)
}

func normalizeImagePrompt(prompt string) string {
	prompt = strings.TrimSpace(prompt)
	if prompt == "" {
		return defaultImagePrompt
	}
	return prompt
}

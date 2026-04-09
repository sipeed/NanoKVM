package picoclaw

import (
	"encoding/json"
	"fmt"
	"io"
	stdhttp "net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
)

const (
	sharedImageImportsDir = ".nanokvm/imports"
	defaultImagePrompt    = "Describe the image briefly."
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

	sharedPath, mimeType, imageErr := prepareSharedImage(req.Path, req.Filename, sessionID)
	if imageErr != nil {
		writePicoclawError(c, imageErr)
		return
	}

	instruction := buildLoadImageInstruction(sharedPath, req.Prompt)
	message := newPicoGatewayMessage(sessionID, map[string]any{
		"content": instruction,
	})
	if err := session.writeUpstreamJSON(s.config.Get(), message); err != nil {
		cleanupPreparedSharedImage(sharedPath)
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to deliver image instruction to picoclaw"))
		return
	}

	writeSuccess(c, gin.H{
		"accepted":      true,
		"session_id":    sessionID,
		"message_id":    message.ID,
		"shared_path":   sharedPath,
		"content_type":  mimeType,
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

func prepareSharedImage(sourcePath string, requestedName string, sessionID string) (string, string, *PicoclawError) {
	sourcePath = strings.TrimSpace(sourcePath)
	if sourcePath == "" {
		return "", "", newPicoclawError(CodeInvalidAction, "image path is required")
	}

	absolutePath, err := filepath.Abs(sourcePath)
	if err != nil {
		return "", "", newPicoclawError(CodeInvalidAction, "failed to resolve image path")
	}

	info, err := os.Stat(absolutePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", "", newPicoclawError(CodeInvalidAction, "image file does not exist")
		}
		return "", "", newPicoclawError(CodeRuntimeUnavailable, "failed to stat image file")
	}
	if info.IsDir() {
		return "", "", newPicoclawError(CodeInvalidAction, "image path points to a directory")
	}

	mimeType, mimeErr := detectSupportedImageType(absolutePath)
	if mimeErr != nil {
		return "", "", mimeErr
	}

	if err := cleanupInactiveSharedImageSessionDirs(sessionID); err != nil {
		return "", "", newPicoclawError(CodeRuntimeUnavailable, "failed to clean shared image directory")
	}

	targetDir, err := resolveSharedImageSessionDir(sessionID)
	if err != nil {
		return "", "", newPicoclawError(CodeRuntimeUnavailable, "failed to resolve picoclaw workspace")
	}
	if err := os.MkdirAll(targetDir, 0o700); err != nil {
		return "", "", newPicoclawError(CodeRuntimeUnavailable, "failed to create shared image directory")
	}

	targetName := buildSharedImageFilename(requestedName, absolutePath, mimeType)
	targetPath := filepath.Join(targetDir, fmt.Sprintf("%d-%s", time.Now().UnixMilli(), targetName))
	if err := copyOrLinkFile(absolutePath, targetPath); err != nil {
		return "", "", newPicoclawError(CodeRuntimeUnavailable, "failed to prepare shared image")
	}

	return targetPath, mimeType, nil
}

func resolveSharedImageImportsRoot() (string, error) {
	workspacePath, err := resolvePicoclawWorkspacePath()
	if err != nil {
		return "", err
	}
	return filepath.Join(workspacePath, sharedImageImportsDir), nil
}

func resolveSharedImageSessionDir(sessionID string) (string, error) {
	root, err := resolveSharedImageImportsRoot()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, sanitizeSharedImageSessionDir(sessionID)), nil
}

func cleanupPreparedSharedImage(path string) {
	path = strings.TrimSpace(path)
	if path == "" {
		return
	}

	_ = os.Remove(path)
	pruneEmptySharedImageDirs(filepath.Dir(path))
}

func cleanupSharedImageSession(sessionID string) {
	dir, err := resolveSharedImageSessionDir(sessionID)
	if err != nil {
		return
	}

	_ = os.RemoveAll(dir)
	pruneEmptySharedImageDirs(filepath.Dir(dir))
}

func cleanupInactiveSharedImageSessionDirs(currentSessionID string) error {
	root, err := resolveSharedImageImportsRoot()
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(root)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	active := GetSessionManager().ActiveSessionDirNames(currentSessionID)
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if _, ok := active[entry.Name()]; ok {
			continue
		}
		_ = os.RemoveAll(filepath.Join(root, entry.Name()))
	}

	pruneEmptySharedImageDirs(root)
	return nil
}

func pruneEmptySharedImageDirs(startDir string) {
	root, err := resolveSharedImageImportsRoot()
	if err != nil {
		return
	}

	nanoKVMDir := filepath.Dir(root)
	current := strings.TrimSpace(startDir)
	for current != "" {
		if current != root && current != nanoKVMDir && !strings.HasPrefix(current, root+string(filepath.Separator)) {
			return
		}
		if err := os.Remove(current); err != nil {
			return
		}
		if current == root || current == nanoKVMDir {
			return
		}
		current = filepath.Dir(current)
	}
}

func detectSupportedImageType(path string) (string, *PicoclawError) {
	file, err := os.Open(path)
	if err != nil {
		return "", newPicoclawError(CodeRuntimeUnavailable, "failed to open image file")
	}
	defer file.Close()

	header := make([]byte, 512)
	n, readErr := file.Read(header)
	if readErr != nil && readErr != io.EOF {
		return "", newPicoclawError(CodeRuntimeUnavailable, "failed to read image file")
	}

	contentType := normalizeSupportedImageType(stdhttp.DetectContentType(header[:n]), path)
	if contentType == "" {
		return "", newPicoclawError(CodeInvalidAction, "unsupported image format")
	}

	return contentType, nil
}

func normalizeSupportedImageType(contentType string, path string) string {
	switch strings.ToLower(strings.TrimSpace(contentType)) {
	case "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp":
		return strings.ToLower(strings.TrimSpace(contentType))
	}

	switch strings.ToLower(filepath.Ext(path)) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".bmp":
		return "image/bmp"
	default:
		return ""
	}
}

func buildSharedImageFilename(requestedName string, sourcePath string, mimeType string) string {
	name := strings.TrimSpace(requestedName)
	if name == "" {
		name = filepath.Base(sourcePath)
	}
	if name == "" || name == "." || name == string(filepath.Separator) {
		name = "image"
	}

	var b strings.Builder
	for _, r := range name {
		switch {
		case unicode.IsLetter(r), unicode.IsDigit(r), r == '.', r == '-', r == '_':
			b.WriteRune(r)
		case unicode.IsSpace(r):
			b.WriteByte('_')
		}
	}

	sanitized := strings.Trim(strings.TrimSpace(b.String()), "._-")
	if sanitized == "" {
		sanitized = "image"
	}

	if filepath.Ext(sanitized) == "" {
		sanitized += defaultImageExtension(mimeType)
	}
	return sanitized
}

func sanitizeSharedImageSessionDir(sessionID string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(sessionID) {
		switch {
		case unicode.IsLetter(r), unicode.IsDigit(r), r == '.', r == '-', r == '_':
			b.WriteRune(r)
		default:
			b.WriteByte('_')
		}
	}

	sanitized := strings.Trim(b.String(), "._-")
	if sanitized == "" {
		return "session"
	}
	return sanitized
}

func defaultImageExtension(mimeType string) string {
	switch mimeType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/bmp":
		return ".bmp"
	default:
		return ".img"
	}
}

func copyOrLinkFile(sourcePath string, targetPath string) error {
	if err := os.Link(sourcePath, targetPath); err == nil {
		return nil
	}

	source, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer source.Close()

	target, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return err
	}

	if _, err := io.Copy(target, source); err != nil {
		target.Close()
		_ = os.Remove(targetPath)
		return err
	}
	if err := target.Close(); err != nil {
		_ = os.Remove(targetPath)
		return err
	}

	return nil
}

func buildLoadImageInstruction(sharedPath string, prompt string) string {
	argsJSON, _ := json.Marshal(map[string]string{"path": sharedPath})
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

package picoclaw

import (
	"bufio"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	picoSessionPrefix          = "agent:main:pico:direct:pico:"
	sanitizedPicoSessionPrefix = "agent_main_pico_direct_pico_"
	maxSessionJSONLLineSize    = 10 * 1024 * 1024
	maxSessionPreviewRunes     = 60
	defaultSessionLimit        = 20
)

type sessionStoredMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type sessionStoredFile struct {
	Key      string                 `json:"key"`
	Messages []sessionStoredMessage `json:"messages"`
	Summary  string                 `json:"summary,omitempty"`
	Created  time.Time              `json:"created"`
	Updated  time.Time              `json:"updated"`
}

type sessionMetaFile struct {
	Key       string    `json:"key"`
	Summary   string    `json:"summary"`
	Skip      int       `json:"skip"`
	Count     int       `json:"count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type sessionListItem struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Preview      string `json:"preview"`
	MessageCount int    `json:"message_count"`
	Created      string `json:"created"`
	Updated      string `json:"updated"`
}

type sessionDetailMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type sessionDetail struct {
	ID       string                 `json:"id"`
	Messages []sessionDetailMessage `json:"messages"`
	Summary  string                 `json:"summary,omitempty"`
	Created  string                 `json:"created"`
	Updated  string                 `json:"updated"`
}

func resolvePicoclawWorkspacePath() (string, error) {
	configPath, err := resolvePicoclawConfigPath()
	if err != nil {
		return "", err
	}

	if doc, err := loadPicoclawConfigDocument(); err == nil {
		if workspace := expandPicoclawPath(doc.config.Agents.Defaults.Workspace); workspace != "" {
			return workspace, nil
		}
	}

	return filepath.Join(filepath.Dir(configPath), "workspace"), nil
}

func resolvePicoclawSessionsPath() (string, error) {
	workspacePath, err := resolvePicoclawWorkspacePath()
	if err != nil {
		return "", err
	}

	return filepath.Join(workspacePath, "sessions"), nil
}

func sanitizeSessionKey(key string) string {
	return strings.ReplaceAll(key, ":", "_")
}

func extractPicoSessionID(key string) (string, bool) {
	if strings.HasPrefix(key, picoSessionPrefix) {
		return strings.TrimPrefix(key, picoSessionPrefix), true
	}
	return "", false
}

func extractPicoSessionIDFromSanitizedKey(key string) (string, bool) {
	if strings.HasPrefix(key, sanitizedPicoSessionPrefix) {
		return strings.TrimPrefix(key, sanitizedPicoSessionPrefix), true
	}
	return "", false
}

func (s *Service) ListSessions(c *gin.Context) {
	dir, err := resolvePicoclawSessionsPath()
	if err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to resolve sessions directory"))
		return
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			writeSuccess(c, []sessionListItem{})
			return
		}
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to read sessions directory"))
		return
	}

	items := make([]sessionListItem, 0)
	seen := make(map[string]struct{})

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		var (
			sessionID string
			sess      sessionStoredFile
			loadErr   error
			ok        bool
		)

		switch {
		case strings.HasSuffix(name, ".jsonl"):
			sessionID, ok = extractPicoSessionIDFromSanitizedKey(strings.TrimSuffix(name, ".jsonl"))
			if !ok {
				continue
			}
			sess, loadErr = readJSONLSession(dir, sessionID)
			if loadErr == nil && isEmptySession(sess) {
				continue
			}
		case strings.HasSuffix(name, ".meta.json"):
			continue
		case strings.HasSuffix(name, ".json"):
			base := strings.TrimSuffix(name, ".json")
			if _, statErr := os.Stat(filepath.Join(dir, base+".jsonl")); statErr == nil {
				if jsonlSessionID, found := extractPicoSessionIDFromSanitizedKey(base); found {
					if jsonlSess, jsonlErr := readJSONLSession(dir, jsonlSessionID); jsonlErr == nil && !isEmptySession(jsonlSess) {
						continue
					}
				}
			}

			sess, loadErr = readLegacySession(dir, name)
			if loadErr == nil && isEmptySession(sess) {
				continue
			}
			if loadErr == nil {
				sessionID, ok = extractPicoSessionID(sess.Key)
				if !ok {
					continue
				}
			}
		default:
			continue
		}

		if loadErr != nil {
			continue
		}
		if _, exists := seen[sessionID]; exists {
			continue
		}

		seen[sessionID] = struct{}{}
		items = append(items, buildSessionListItem(sessionID, sess))
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Updated > items[j].Updated
	})

	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultSessionLimit)))
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = defaultSessionLimit
	}

	if offset >= len(items) {
		writeSuccess(c, []sessionListItem{})
		return
	}

	end := offset + limit
	if end > len(items) {
		end = len(items)
	}

	writeSuccess(c, items[offset:end])
}

func (s *Service) GetSession(c *gin.Context) {
	sessionID := strings.TrimSpace(c.Param("id"))
	if sessionID == "" {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "missing session id"))
		return
	}

	dir, err := resolvePicoclawSessionsPath()
	if err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to resolve sessions directory"))
		return
	}

	sess, err := readJSONLSession(dir, sessionID)
	if err == nil && isEmptySession(sess) {
		err = os.ErrNotExist
	}
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			sess, err = readLegacySession(dir, sanitizeSessionKey(picoSessionPrefix+sessionID)+".json")
			if err == nil && isEmptySession(sess) {
				err = os.ErrNotExist
			}
		}
		if err != nil {
			sessionErr := newPicoclawError(CodeRuntimeUnavailable, "session not found")
			sessionErr.StatusCode = http.StatusNotFound
			writePicoclawError(c, sessionErr)
			return
		}
	}

	messages := make([]sessionDetailMessage, 0, len(sess.Messages))
	for _, msg := range sess.Messages {
		if (msg.Role == "user" || msg.Role == "assistant") && strings.TrimSpace(msg.Content) != "" {
			messages = append(messages, sessionDetailMessage{
				Role:    msg.Role,
				Content: msg.Content,
			})
		}
	}

	writeSuccess(c, sessionDetail{
		ID:       sessionID,
		Messages: messages,
		Summary:  sess.Summary,
		Created:  sess.Created.Format(time.RFC3339),
		Updated:  sess.Updated.Format(time.RFC3339),
	})
}

func (s *Service) DeleteSession(c *gin.Context) {
	sessionID := strings.TrimSpace(c.Param("id"))
	if sessionID == "" {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "missing session id"))
		return
	}

	dir, err := resolvePicoclawSessionsPath()
	if err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to resolve sessions directory"))
		return
	}

	base := filepath.Join(dir, sanitizeSessionKey(picoSessionPrefix+sessionID))
	paths := []string{base + ".jsonl", base + ".meta.json", base + ".json"}
	removed := false

	for _, path := range paths {
		if err := os.Remove(path); err != nil {
			if os.IsNotExist(err) {
				continue
			}
			writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, "failed to delete session"))
			return
		}
		removed = true
	}

	if !removed {
		sessionErr := newPicoclawError(CodeRuntimeUnavailable, "session not found")
		sessionErr.StatusCode = http.StatusNotFound
		writePicoclawError(c, sessionErr)
		return
	}

	writeSuccess(c, gin.H{
		"id":      sessionID,
		"deleted": true,
	})
}

func readLegacySession(dir, fileName string) (sessionStoredFile, error) {
	data, err := os.ReadFile(filepath.Join(dir, fileName))
	if err != nil {
		return sessionStoredFile{}, err
	}

	var sess sessionStoredFile
	if err := json.Unmarshal(data, &sess); err != nil {
		return sessionStoredFile{}, err
	}

	return sess, nil
}

func readSessionMeta(path, sessionKey string) (sessionMetaFile, error) {
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return sessionMetaFile{Key: sessionKey}, nil
	}
	if err != nil {
		return sessionMetaFile{}, err
	}

	var meta sessionMetaFile
	if err := json.Unmarshal(data, &meta); err != nil {
		return sessionMetaFile{}, err
	}
	if meta.Key == "" {
		meta.Key = sessionKey
	}

	return meta, nil
}

func readSessionMessages(path string, skip int) ([]sessionStoredMessage, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	messages := make([]sessionStoredMessage, 0)
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0, 64*1024), maxSessionJSONLLineSize)

	seen := 0
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		seen++
		if seen <= skip {
			continue
		}

		var msg sessionStoredMessage
		if err := json.Unmarshal(line, &msg); err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}

func readJSONLSession(dir, sessionID string) (sessionStoredFile, error) {
	sessionKey := picoSessionPrefix + sessionID
	base := filepath.Join(dir, sanitizeSessionKey(sessionKey))
	jsonlPath := base + ".jsonl"
	metaPath := base + ".meta.json"

	meta, err := readSessionMeta(metaPath, sessionKey)
	if err != nil {
		return sessionStoredFile{}, err
	}

	messages, err := readSessionMessages(jsonlPath, meta.Skip)
	if err != nil {
		return sessionStoredFile{}, err
	}

	created := meta.CreatedAt
	updated := meta.UpdatedAt
	if created.IsZero() || updated.IsZero() {
		if info, statErr := os.Stat(jsonlPath); statErr == nil {
			if created.IsZero() {
				created = info.ModTime()
			}
			if updated.IsZero() {
				updated = info.ModTime()
			}
		}
	}

	return sessionStoredFile{
		Key:      meta.Key,
		Messages: messages,
		Summary:  meta.Summary,
		Created:  created,
		Updated:  updated,
	}, nil
}

func buildSessionListItem(sessionID string, sess sessionStoredFile) sessionListItem {
	preview := ""
	for _, msg := range sess.Messages {
		if msg.Role == "user" && strings.TrimSpace(msg.Content) != "" {
			preview = msg.Content
			break
		}
	}

	title := strings.TrimSpace(sess.Summary)
	if title == "" {
		title = preview
	}

	title = truncateRunes(title, maxSessionPreviewRunes)
	preview = truncateRunes(preview, maxSessionPreviewRunes)
	if preview == "" {
		preview = "(empty)"
	}
	if title == "" {
		title = preview
	}

	messageCount := 0
	for _, msg := range sess.Messages {
		if (msg.Role == "user" || msg.Role == "assistant") && strings.TrimSpace(msg.Content) != "" {
			messageCount++
		}
	}

	return sessionListItem{
		ID:           sessionID,
		Title:        title,
		Preview:      preview,
		MessageCount: messageCount,
		Created:      sess.Created.Format(time.RFC3339),
		Updated:      sess.Updated.Format(time.RFC3339),
	}
}

func isEmptySession(sess sessionStoredFile) bool {
	return len(sess.Messages) == 0 && strings.TrimSpace(sess.Summary) == ""
}

func truncateRunes(s string, maxLen int) string {
	if maxLen <= 0 {
		return ""
	}

	runes := []rune(strings.TrimSpace(s))
	if len(runes) <= maxLen {
		return string(runes)
	}

	return string(runes[:maxLen]) + "..."
}

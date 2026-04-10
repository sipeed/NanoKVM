package picoclaw

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func (s *Service) ReleaseRuntimeSession(c *gin.Context) {
	sessionID := strings.TrimSpace(c.GetHeader(sessionIDHeader))
	if sessionID == "" {
		writePicoclawError(c, newPicoclawError(CodeSessionIDMissing, "missing X-PicoClaw-Session-ID"))
		return
	}

	if session, ok := GetSessionManager().Get(sessionID); ok {
		s.closeGatewaySession(session, websocket.CloseNormalClosure, "session released")
	} else {
		ReleaseSession(sessionID)
	}

	status := s.runtime.Get()
	status.CurrentSession = s.lock.Owner()
	s.runtime.Set(status)

	writeSuccess(c, gin.H{
		"released":        true,
		"current_session": status.CurrentSession,
	})
}

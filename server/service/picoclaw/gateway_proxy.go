package picoclaw

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

var gatewayUpgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type relayResult struct {
	Source    string
	CloseCode int
	Reason    string
}

func (s *Service) ConnectGateway(c *gin.Context) {
	sessionID := strings.TrimSpace(c.Query("session_id"))
	if sessionID == "" {
		sessionID = uuid.NewString()
	}

	if lockErr := s.lock.Ensure(sessionID); lockErr != nil {
		c.AbortWithStatusJSON(http.StatusConflict, gin.H{
			"code":    CodePicoclawLockHeld,
			"message": lockErr.Message,
		})
		return
	}

	session, sessionErr := GetSessionManager().Register(sessionID, nil)
	if sessionErr != nil {
		s.lock.Release(sessionID)
		c.AbortWithStatusJSON(http.StatusConflict, gin.H{
			"code":    CodePicoclawLockHeld,
			"message": sessionErr.Message,
		})
		return
	}
	GetSessionManager().SetState(sessionID, SessionStateConnecting)

	if runtimeErr := s.syncConfigFromPicoclaw(); runtimeErr != nil {
		s.closeGatewaySession(session, CloseCodeRuntimeUnavailable, runtimeErr.Message)
		return
	}

	upstream, gatewayErr := s.connectGateway(sessionID)
	if gatewayErr != nil {
		s.closeGatewaySession(session, CloseCodeRuntimeUnavailable, gatewayErr.Message)
		return
	}

	downstream, err := gatewayUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to upgrade gateway websocket: %s", err)
		_ = upstream.Close()
		ReleaseSession(sessionID)
		GetSessionManager().SetState(sessionID, SessionStateClosed)
		GetSessionManager().Remove(sessionID)
		return
	}

	GetSessionManager().AttachUpstream(sessionID, upstream)
	GetSessionManager().AttachDownstream(sessionID, downstream)
	GetSessionManager().SetState(sessionID, SessionStateActive)

	var wg sync.WaitGroup
	results := make(chan relayResult, 2)
	cfg := s.config.Get()

	s.configureRelayConn(downstream, cfg)
	s.configureRelayConn(upstream, cfg)

	wg.Add(4)
	go s.runPingLoop("downstream", downstream, cfg, &wg)
	go s.runPingLoop("upstream", upstream, cfg, &wg)
	go s.proxyMessages("downstream", session, downstream, cfg, &wg, results)
	go s.proxyMessages("upstream", session, upstream, cfg, &wg, results)

	result := <-results
	closeCode := result.CloseCode
	if closeCode == 0 {
		closeCode = websocket.CloseNormalClosure
	}

	if result.Source == "upstream" {
		if closeCode == websocket.CloseNormalClosure {
			closeCode = CloseCodeUpstreamClosed
		}
		s.closeGatewaySession(session, closeCode, result.Reason)
	} else {
		s.closeGatewaySession(session, closeCode, result.Reason)
	}

	wg.Wait()
}

func (s *Service) proxyMessages(source string, session *GatewaySession, src *websocket.Conn, cfg Config, wg *sync.WaitGroup, results chan<- relayResult) {
	defer wg.Done()

	for {
		messageType, data, err := src.ReadMessage()
		if err != nil {
			results <- relayResult{
				Source:    source,
				CloseCode: closeCodeFromError(source, err),
				Reason:    closeReasonFromError(err),
			}
			return
		}

		if source == "upstream" && messageType == websocket.BinaryMessage {
			results <- relayResult{
				Source:    source,
				CloseCode: CloseCodeUpstreamClosed,
				Reason:    "upstream sent unsupported binary message",
			}
			return
		}

		var writeErr error
		switch source {
		case "downstream":
			writeErr = session.writeUpstreamMessage(cfg, messageType, data)
		default:
			writeErr = session.writeDownstreamMessage(cfg, messageType, data)
		}
		if writeErr != nil {
			results <- relayResult{
				Source:    source,
				CloseCode: closeCodeFromError(source, writeErr),
				Reason:    closeReasonFromError(writeErr),
			}
			return
		}
	}
}

func (s *Service) runPingLoop(name string, conn *websocket.Conn, cfg Config, wg *sync.WaitGroup) {
	defer wg.Done()

	ticker := time.NewTicker(time.Duration(cfg.PingIntervalMs) * time.Millisecond)
	defer ticker.Stop()

	for range ticker.C {
		if err := conn.WriteControl(
			websocket.PingMessage,
			[]byte(name),
			time.Now().Add(time.Duration(cfg.WriteTimeoutMs)*time.Millisecond),
		); err != nil {
			return
		}
	}
}

func (s *Service) configureRelayConn(conn *websocket.Conn, cfg Config) {
	readTimeout := time.Duration(cfg.ReadTimeoutMs) * time.Millisecond
	conn.SetReadLimit(int64(cfg.MaxMessageBytes))
	_ = conn.SetReadDeadline(time.Now().Add(readTimeout))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(readTimeout))
	})
}

func (s *Service) closeGatewaySession(session *GatewaySession, closeCode int, reason string) {
	if session == nil {
		return
	}

	session.closeOnce.Do(func() {
		GetSessionManager().SetState(session.SessionID, SessionStateClosing)

		if session.Upstream != nil {
			writeGatewayClose(session.Upstream, websocket.CloseNormalClosure, "relay closing")
			_ = session.Upstream.Close()
		}
		if session.Downstream != nil {
			writeGatewayClose(session.Downstream, closeCode, reason)
			_ = session.Downstream.Close()
		}

		ReleaseSession(session.SessionID)
		GetSessionManager().SetState(session.SessionID, SessionStateClosed)
		GetSessionManager().Remove(session.SessionID)

		status := s.runtime.Get()
		status.CurrentSession = s.lock.Owner()
		if closeCode == CloseCodeUpstreamClosed || closeCode == CloseCodeRuntimeUnavailable {
			status.Ready = false
			if closeCode == CloseCodeUpstreamClosed {
				status.Status = "unavailable"
			}
			status.LastError = reason
			status.CheckedAt = time.Now()
			s.runtime.Set(status)
		}
	})
}

func writeGatewayClose(conn *websocket.Conn, code int, reason string) {
	if conn == nil {
		return
	}

	message := websocket.FormatCloseMessage(code, reason)
	_ = conn.WriteControl(websocket.CloseMessage, message, time.Now().Add(2*time.Second))
}

func closeCodeFromError(source string, err error) int {
	if closeErr, ok := err.(*websocket.CloseError); ok {
		if closeErr.Code == websocket.CloseNormalClosure || closeErr.Code == websocket.CloseGoingAway {
			return websocket.CloseNormalClosure
		}
		if closeErr.Code == websocket.CloseAbnormalClosure || closeErr.Code == websocket.CloseNoStatusReceived {
			if source == "upstream" {
				return CloseCodeUpstreamClosed
			}
			return websocket.CloseNormalClosure
		}
		return closeErr.Code
	}

	if source == "upstream" {
		return CloseCodeUpstreamClosed
	}
	return websocket.CloseNormalClosure
}

func closeReasonFromError(err error) string {
	if err == nil {
		return "closed"
	}
	if closeErr, ok := err.(*websocket.CloseError); ok {
		if closeErr.Text != "" {
			return closeErr.Text
		}
	}
	return fmt.Sprintf("relay closed: %v", err)
}

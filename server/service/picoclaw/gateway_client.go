package picoclaw

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

func (s *Service) connectGateway(sessionID string) (*websocket.Conn, *PicoclawError) {
	cfg := s.config.Get()

	gatewayURL, err := buildGatewayURL(cfg, sessionID)
	if err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "config_error"
			status.ConfigError = err.Error()
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
			status.CurrentSession = s.lock.Owner()
		})
		return nil, newPicoclawError(CodeRuntimeUnavailable, err.Error())
	}

	header := http.Header{}
	if cfg.Token != "" {
		header.Set("Authorization", fmt.Sprintf("Bearer %s", cfg.Token))
	}

	dialer := websocket.Dialer{
		HandshakeTimeout: time.Duration(cfg.ConnectTimeoutMs) * time.Millisecond,
		NetDialContext: (&net.Dialer{
			Timeout: time.Duration(cfg.ConnectTimeoutMs) * time.Millisecond,
		}).DialContext,
	}

	upstream, response, err := dialer.Dial(gatewayURL, header)
	if err != nil {
		s.runtime.Update(func(status *RuntimeStatus) {
			status.Ready = false
			status.Status = "unavailable"
			status.ConfigError = ""
			status.LastError = err.Error()
			status.CheckedAt = time.Now()
			status.CurrentSession = s.lock.Owner()
			if response != nil && response.StatusCode == http.StatusUnauthorized {
				status.Status = "config_error"
				status.ConfigError = "gateway authentication failed"
			}
		})
		return nil, newPicoclawError(CodeRuntimeUnavailable, "gateway is unavailable")
	}

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = true
		status.Status = "ready"
		status.ConfigError = ""
		status.LastError = ""
		status.CheckedAt = time.Now()
		status.CurrentSession = s.lock.Owner()
	})

	return upstream, nil
}

func buildGatewayURL(cfg Config, sessionID string) (string, error) {
	parsed, err := url.Parse(cfg.GatewayURL)
	if err != nil {
		return "", fmt.Errorf("invalid gateway url: %w", err)
	}
	if parsed.Scheme != "ws" && parsed.Scheme != "wss" {
		return "", fmt.Errorf("invalid gateway url scheme: %s", parsed.Scheme)
	}
	if parsed.Host == "" {
		return "", fmt.Errorf("invalid gateway url host")
	}

	query := parsed.Query()
	query.Set("session_id", sessionID)
	if cfg.Token != "" && cfg.AllowTokenQuery {
		query.Set("token", cfg.Token)
	}
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func gatewayHostPort(parsed *url.URL) (string, error) {
	if parsed == nil || parsed.Host == "" {
		return "", fmt.Errorf("invalid gateway url host")
	}
	if _, _, err := net.SplitHostPort(parsed.Host); err == nil {
		return parsed.Host, nil
	}

	switch parsed.Scheme {
	case "ws":
		return net.JoinHostPort(parsed.Host, "80"), nil
	case "wss":
		return net.JoinHostPort(parsed.Host, "443"), nil
	default:
		return "", fmt.Errorf("invalid gateway url scheme: %s", parsed.Scheme)
	}
}

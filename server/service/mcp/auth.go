package mcpservice

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"NanoKVM-Server/service/controlmode"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func APIKeyMiddleware(control *controlmode.Manager) gin.HandlerFunc {
	if control == nil {
		control = controlmode.GetManager()
	}
	return func(c *gin.Context) {
		if err := control.Require(controlmode.ModeMCP); err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "MCP service is disabled"})
			c.Abort()
			return
		}

		cfg, err := loadConfig()
		if err != nil {
			log.Errorf("failed to load MCP config for authentication: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "MCP auth unavailable"})
			c.Abort()
			return
		}
		token, ok := extractBearer(c.GetHeader("Authorization"))
		if !ok || cfg.APIKey == "" || subtle.ConstantTimeCompare([]byte(token), []byte(cfg.APIKey)) != 1 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid MCP API key"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func extractBearer(header string) (string, bool) {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return "", false
	}

	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	return token, token != ""
}

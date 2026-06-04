package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"NanoKVM-Server/service/audit"
)

// auditActions maps an API path to a short, human-readable description. Paths
// not listed here are still logged (by method + path); this map only adds a
// friendlier label for the most security-relevant actions.
var auditActions = map[string]string{
	"/api/auth/login":          "login",
	"/api/auth/logout":         "logout",
	"/api/auth/password":       "change own password",
	"/api/auth/users":          "create user",
	"/api/vm/gpio":             "power / reset button",
	"/api/vm/system/reboot":    "reboot device",
	"/api/vm/script/run":       "run script",
	"/api/vm/script/upload":    "upload script",
	"/api/vm/terminal":         "open web terminal",
	"/api/vm/ssh/enable":       "enable SSH",
	"/api/vm/ssh/disable":      "disable SSH",
	"/api/vm/hdmi/enable":      "enable HDMI",
	"/api/vm/hdmi/disable":     "disable HDMI",
	"/api/hid/paste":           "paste text",
	"/api/hid/mode":            "change HID mode",
	"/api/hid/reset":           "reset HID",
	"/api/application/update":  "update firmware",
	"/api/storage/image/mount": "mount virtual media",
}

// Audit records who did what. Register it as a global middleware (r.Use) so it
// wraps every request. It reads the username/role that CheckToken stores in the
// context, which is available after c.Next() returns. Read-only GET requests
// are skipped to keep the log focused on actions that change state.
func Audit() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		if !audit.Enabled() {
			return
		}

		path := c.Request.URL.Path
		method := c.Request.Method

		// Only audit API calls.
		if len(path) < 5 || path[:5] != "/api/" {
			return
		}
		// Skip read-only methods (the action log is about changes, not views).
		switch method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			return
		}

		user := c.GetString("username")
		role := c.GetString("role")

		// The login handler runs on a public route (no CheckToken), so it sets
		// these explicitly — including for failed attempts.
		if v := c.GetString("audit_user"); v != "" {
			user = v
		}
		if v := c.GetString("audit_role"); v != "" {
			role = v
		}
		result := c.GetString("audit_result") // "success" / "failure" when the handler set it

		audit.Write(audit.Entry{
			User:   user,
			Role:   role,
			IP:     c.ClientIP(),
			Method: method,
			Path:   path,
			Action: auditActions[path],
			Status: c.Writer.Status(),
			Result: result,
			MS:     time.Since(start).Milliseconds(),
		})
	}
}

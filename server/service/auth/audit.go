package auth

import (
	"strconv"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/config"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/audit"
)

// GetAuditLog returns the most recent audit entries (admin only; the route is
// guarded by RequireRole(admin)). Optional query param: ?limit=N (1..2000).
func (s *Service) GetAuditLog(c *gin.Context) {
	var rsp proto.Response

	limit := 200
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 2000 {
			limit = n
		}
	}

	entries, err := audit.Recent(limit)
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to read audit log")
		return
	}

	rsp.OkRspWithData(c, gin.H{"entries": entries})
}

// GetAuditConfig reports whether the audit log is currently enabled (admin only).
func (s *Service) GetAuditConfig(c *gin.Context) {
	var rsp proto.Response
	rsp.OkRspWithData(c, &proto.GetAuditConfigRsp{
		Enabled: audit.IsEnabled(),
	})
}

// SetAuditConfig enables or disables the audit log at runtime and persists the
// choice to the configuration file (admin only).
func (s *Service) SetAuditConfig(c *gin.Context) {
	var req proto.SetAuditConfigReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil || req.Enabled == nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if err := audit.SetEnabled(*req.Enabled); err != nil {
		rsp.ErrRsp(c, -2, "failed to update audit log state")
		return
	}

	// Persist to /etc/kvm/server.yaml so the setting survives a restart.
	conf := config.GetInstance()
	conf.Audit.Enabled = req.Enabled
	if err := config.Write(conf); err != nil {
		// Runtime state was changed; report the persistence failure but don't roll back.
		log.Errorf("audit: failed to persist config: %v", err)
		rsp.ErrRsp(c, -3, "state changed but failed to save config")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("audit log enabled set to %v", *req.Enabled)
}

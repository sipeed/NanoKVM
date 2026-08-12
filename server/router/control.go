package router

import (
	"net/http"
	"time"

	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/inputcontrol"
	"NanoKVM-Server/service/picoclaw"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type setAIControlModeRequest struct {
	Mode controlmode.Mode `json:"mode"`
}

func controlRouter(r *gin.Engine, control *controlmode.Manager, picoclawService *picoclaw.Service) {
	group := r.Group("/api/ai/control").Use(middleware.CheckToken())
	group.GET("/status", func(c *gin.Context) {
		status, err := control.Status()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"code": -1, "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "success", "data": status})
	})

	group.PUT("/mode", func(c *gin.Context) {
		startedAt := time.Now()
		var req setAIControlModeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusOK, gin.H{"code": -1, "message": "invalid arguments"})
			return
		}
		if !validAIControlMode(req.Mode) {
			c.JSON(http.StatusOK, gin.H{"code": -1, "message": "invalid control mode"})
			return
		}

		previousStatus, previousErr := control.Status()
		if previousErr != nil {
			log.WithFields(log.Fields{
				"request_mode": string(req.Mode),
				"elapsed_ms":   time.Since(startedAt).Milliseconds(),
			}).WithError(previousErr).Warn("AI control mode request failed before switch")
			c.JSON(http.StatusOK, gin.H{"code": -2, "message": previousErr.Error()})
			return
		}

		preempt := func() error {
			inputcontrol.GetCoordinator().CancelMCP()
			if req.Mode == controlmode.ModeMCP {
				return picoclawService.PreemptControlLeasesForMCP()
			}
			picoclawService.CancelActiveControlOperations()
			return nil
		}
		cleanup := func() error {
			return hid.ReleaseAllHIDStateBestEffort()
		}
		if req.Mode == controlmode.ModeMCP {
			cleanup = func() error {
				if err := picoclawService.StopRuntimeForMCP(); err != nil {
					return err
				}
				return hid.ReleaseAllHIDStateBestEffort()
			}
		}
		if err := control.SwitchWithCleanup(req.Mode, preempt, cleanup); err != nil {
			if req.Mode == controlmode.ModeOff {
				if status, statusErr := control.Status(); statusErr == nil && status.Mode == controlmode.ModeOff {
					picoclawService.CancelActiveControlOperations()
					picoclawService.PreserveRuntimeForChatOnly("control_release_chat_only")
					closedSessions := 0
					picoclawService.PublishControlModeChangedFrom(status, "ai_control_mode")
					log.WithFields(log.Fields{
						"request_mode":    string(req.Mode),
						"previous_mode":   string(previousStatus.Mode),
						"final_mode":      string(status.Mode),
						"transitioning":   status.Transitioning,
						"closed_sessions": closedSessions,
						"elapsed_ms":      time.Since(startedAt).Milliseconds(),
					}).WithError(err).Warn("AI control mode request completed with cleanup warning")
					c.JSON(http.StatusOK, gin.H{
						"code": 0,
						"msg":  "success",
						"data": gin.H{
							"control":         status,
							"runtime":         picoclawService.RuntimeStatus(),
							"released":        true,
							"closed_sessions": closedSessions,
							"cleanup_warning": err.Error(),
						},
					})
					return
				}
			}
			log.WithFields(log.Fields{
				"request_mode":  string(req.Mode),
				"previous_mode": string(previousStatus.Mode),
				"elapsed_ms":    time.Since(startedAt).Milliseconds(),
			}).WithError(err).Warn("AI control mode request failed")
			c.JSON(http.StatusOK, gin.H{"code": -2, "message": err.Error()})
			return
		}

		status, err := control.Status()
		if err != nil {
			log.WithFields(log.Fields{
				"request_mode":  string(req.Mode),
				"previous_mode": string(previousStatus.Mode),
				"elapsed_ms":    time.Since(startedAt).Milliseconds(),
			}).WithError(err).Warn("AI control mode request failed after switch")
			c.JSON(http.StatusOK, gin.H{"code": -2, "message": err.Error()})
			return
		}
		closedSessions := 0
		if req.Mode == controlmode.ModeOff {
			picoclawService.CancelActiveControlOperations()
			picoclawService.PreserveRuntimeForChatOnly("control_release_chat_only")
		}
		picoclawService.PublishControlModeChangedFrom(status, "ai_control_mode")
		log.WithFields(log.Fields{
			"request_mode":  string(req.Mode),
			"previous_mode": string(previousStatus.Mode),
			"final_mode":    string(status.Mode),
			"transitioning": status.Transitioning,
			"elapsed_ms":    time.Since(startedAt).Milliseconds(),
		}).Info("AI control mode request completed")
		if req.Mode == controlmode.ModeOff {
			c.JSON(http.StatusOK, gin.H{
				"code": 0,
				"msg":  "success",
				"data": gin.H{
					"control":         status,
					"runtime":         picoclawService.RuntimeStatus(),
					"released":        true,
					"closed_sessions": closedSessions,
					"cleanup_warning": "",
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "success", "data": status})
	})
}

func validAIControlMode(mode controlmode.Mode) bool {
	switch mode {
	case controlmode.ModeOff, controlmode.ModeMCP, controlmode.ModePicoclaw:
		return true
	default:
		return false
	}
}

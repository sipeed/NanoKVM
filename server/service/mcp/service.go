package mcpservice

import (
	"errors"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/inputcontrol"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Service struct {
	control               *controlmode.Manager
	preemptPicoclawLeases func() error
	stopPicoclawForMCP    func() error
	releaseHID            func() error
	onControlChange       func(controlmode.Status)
}

func NewService(control *controlmode.Manager, releaseHID func() error) *Service {
	return NewServiceWithPreempt(control, nil, nil, releaseHID, nil)
}

func NewServiceWithPreempt(
	control *controlmode.Manager,
	preemptPicoclawLeases func() error,
	stopPicoclawForMCP func() error,
	releaseHID func() error,
	onControlChange func(controlmode.Status),
) *Service {
	if control == nil {
		control = controlmode.GetManager()
	}
	if releaseHID == nil {
		releaseHID = hid.ReleaseAllHIDState
	}
	return &Service{
		control:               control,
		preemptPicoclawLeases: preemptPicoclawLeases,
		stopPicoclawForMCP:    stopPicoclawForMCP,
		releaseHID:            releaseHID,
		onControlChange:       onControlChange,
	}
}

func (s *Service) GetConfig(c *gin.Context) {
	var rsp proto.Response
	c.Header("Cache-Control", "no-store")

	cfg, err := loadConfig()
	if err != nil {
		log.Errorf("failed to load MCP config: %v", err)
		rsp.ErrRsp(c, -1, "get MCP config failed")
		return
	}
	status, err := s.control.Status()
	if err != nil {
		log.Errorf("failed to load AI control mode: %v", err)
		rsp.ErrRsp(c, -1, "get MCP config failed")
		return
	}

	rsp.OkRspWithData(c, mcpConfigResponse(cfg, status))
}

func (s *Service) SetConfig(c *gin.Context) {
	var req proto.SetMCPConfigReq
	var rsp proto.Response
	c.Header("Cache-Control", "no-store")

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	var cfg Config
	var err error
	cancelMCP := func() error {
		inputcontrol.GetCoordinator().CancelMCP()
		return nil
	}
	preemptForEnable := func() error {
		if err := cancelMCP(); err != nil {
			return err
		}
		if s.preemptPicoclawLeases != nil {
			return s.preemptPicoclawLeases()
		}
		return nil
	}
	cleanupForEnable := func() error {
		var errs []error
		if s.stopPicoclawForMCP != nil {
			errs = append(errs, s.stopPicoclawForMCP())
		}
		if s.releaseHID != nil {
			errs = append(errs, s.releaseHID())
		}
		return errors.Join(errs...)
	}
	if *req.Enabled {
		cfg, err = updateConfig(ensureAPIKey)
		if err == nil {
			err = s.control.SwitchWithCleanup(
				controlmode.ModeMCP,
				preemptForEnable,
				cleanupForEnable,
			)
		}
	} else {
		cfg, err = loadConfig()
		if err == nil {
			_, err = s.control.SwitchIfWithCleanup(
				controlmode.ModeMCP,
				controlmode.ModeOff,
				cancelMCP,
				s.releaseHID,
			)
		}
	}
	if err != nil {
		log.Errorf("failed to switch MCP control mode: %v", err)
		rsp.ErrRsp(c, -2, "operation failed: "+err.Error())
		return
	}
	status, err := s.control.Status()
	if err != nil {
		log.Errorf("failed to load AI control mode: %v", err)
		rsp.ErrRsp(c, -2, "operation failed: "+err.Error())
		return
	}
	if s.onControlChange != nil {
		s.onControlChange(status)
	}

	rsp.OkRspWithData(c, mcpConfigResponse(cfg, status))
}

func (s *Service) RegenerateAPIKey(c *gin.Context) {
	var rsp proto.Response
	c.Header("Cache-Control", "no-store")

	cfg, err := updateConfig(regenerateAPIKey)
	if err != nil {
		log.Errorf("failed to regenerate MCP API key: %v", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}
	status, err := s.control.Status()
	if err != nil {
		log.Errorf("failed to load AI control mode: %v", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	rsp.OkRspWithData(c, mcpConfigResponse(cfg, status))
}

func mcpConfigResponse(cfg Config, status controlmode.Status) *proto.GetMCPConfigRsp {
	return &proto.GetMCPConfigRsp{
		Enabled:       status.Mode == controlmode.ModeMCP && !status.Transitioning,
		APIKey:        cfg.APIKey,
		ControlMode:   string(status.Mode),
		Transitioning: status.Transitioning,
	}
}

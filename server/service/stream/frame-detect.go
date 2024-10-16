package stream

import (
	"errors"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

const (
	frameDetect    = "/etc/kvm/frame_detact"
	frameDetectTmp = "/etc/kvm/frame_detact_tmp"
)

type UpdateFrameDetectRsp struct {
	Enabled bool `json:"enabled"`
}

func (s *Service) GetFrameDetect(c *gin.Context) {
	var rsp proto.Response

	isEnabled, err := isFrameDetectEnabled()
	if err != nil {
		rsp.ErrRsp(c, -1, "unknown frame detect status")
		return
	}

	rsp.OkRspWithData(c, &proto.GetFrameDetectRsp{
		Enabled: isEnabled,
	})
	log.Debugf("get frame detect success, enabled: %t", isEnabled)
}

func (s *Service) UpdateFrameDetect(c *gin.Context) {
	var rsp proto.Response

	isEnabled, err := isFrameDetectEnabled()
	if err != nil {
		rsp.ErrRsp(c, -1, "unknown frame status")
		return
	}

	if isEnabled {
		_ = os.Remove(frameDetect)
		_ = os.Remove(frameDetectTmp)
	} else {
		file, err2 := os.OpenFile(frameDetect, os.O_CREATE|os.O_TRUNC, 0o644)
		if err2 != nil {
			rsp.ErrRsp(c, -3, "enable frame detect failed")
			return
		}
		defer func() {
			_ = file.Close()
		}()
	}

	isEnabled, err = isFrameDetectEnabled()
	if err != nil {
		rsp.ErrRsp(c, -4, "unknown frame status")
		return
	}

	rsp.OkRspWithData(c, &UpdateFrameDetectRsp{
		Enabled: isEnabled,
	})
	log.Debugf("update frame detect success, enabled: %t", isEnabled)
}

func (s *Service) StopFrameDetect(c *gin.Context) {
	var rsp proto.Response

	exist, err := isFileExist(frameDetect)
	if err != nil {
		rsp.ErrRsp(c, -1, "unknown frame status")
		return
	}

	if !exist {
		rsp.OkRsp(c)
		return
	}

	err = os.Rename(frameDetect, frameDetectTmp)
	if err != nil {
		rsp.ErrRsp(c, -2, "stop operation failed")
		return
	}

	go func() {
		time.Sleep(20 * time.Second)
		_ = os.Rename(frameDetectTmp, frameDetect)
		log.Debugf("frame detect started")
	}()

	rsp.OkRsp(c)
	log.Debugf("frame detect stoped")
}

func isFrameDetectEnabled() (bool, error) {
	exist, err := isFileExist(frameDetect)
	if err != nil {
		return false, err
	}

	if exist {
		return true, nil
	}

	exist, err = isFileExist(frameDetectTmp)
	if err != nil {
		return false, err
	}

	return exist, nil
}

func isFileExist(name string) (bool, error) {
	_, err := os.Stat(name)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return false, nil
		}

		return false, nil
	}

	return true, nil
}

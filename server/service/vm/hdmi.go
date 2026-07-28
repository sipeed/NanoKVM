package vm

import (
	"sync"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var (
	hdmiMutex          sync.Mutex
	hdmiIdleTimer      *time.Timer
	hdmiIdleGeneration uint64
	hdmiViewerCount    int
	hdmiViewerSources  = make(map[string]int)
	hdmiStoppedForIdle bool
)

func (s *Service) ResetHdmi(c *gin.Context) {
	var rsp proto.Response

	utils.PersistHDMIEnabled()
	DisableHdmiCapture()
	time.Sleep(1 * time.Second)
	EnableHdmiCapture()

	rsp.OkRsp(c)
	log.Debug("reset hdmi")
}

func (s *Service) EnableHdmi(c *gin.Context) {
	var rsp proto.Response

	utils.PersistHDMIEnabled()
	EnableHdmiCapture()

	rsp.OkRsp(c)
	log.Debug("enable hdmi")
}

func (s *Service) DisableHdmi(c *gin.Context) {
	var rsp proto.Response

	utils.PersistHDMIDisabled()
	DisableHdmiCapture()

	rsp.OkRsp(c)
	log.Debug("disable hdmi")
}

func (s *Service) GetHdmiState(c *gin.Context) {
	var rsp proto.Response

	rsp.OkRspWithData(c, &proto.GetGetHdmiStateRsp{
		Enabled:     !utils.IsHdmiDisabled(),
		IdleTimeout: utils.GetHDMIIdleTimeout(),
	})

	log.Debug("get hdmi state")
}

func EnableHdmiCapture() {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	common.GetKvmVision().SetHDMI(true)
	hdmiStoppedForIdle = false
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	scheduleHdmiIdleTimerLocked()
}

func DisableHdmiCapture() {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	common.GetKvmVision().SetHDMI(false)
	hdmiStoppedForIdle = false
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
}

func (s *Service) SetHdmiIdleTimeout(c *gin.Context) {
	var req proto.SetHdmiIdleTimeoutReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	SetHdmiIdleTimeout(req.Minutes)
	rsp.OkRsp(c)
}

func SetHdmiIdleTimeout(minutes int) {
	if minutes < 0 {
		return
	}

	utils.PersistHDMIIdleTimeout(minutes)

	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	if hdmiStoppedForIdle && !utils.IsHdmiDisabled() {
		common.GetKvmVision().SetHDMI(true)
		hdmiStoppedForIdle = false
	}
	if hdmiViewerCount == 0 && !hdmiStoppedForIdle {
		scheduleHdmiIdleTimerLocked()
	}
}

func SetHdmiViewerCount(count int) {
	SetHdmiViewerCountForSource("webrtc", count)
}

func SetHdmiViewerCountForSource(source string, count int) {
	if count < 0 {
		count = 0
	}

	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	hdmiViewerSources[source] = count
	hdmiViewerCount = 0
	for _, sourceCount := range hdmiViewerSources {
		hdmiViewerCount += sourceCount
	}
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()

	if count > 0 {
		if hdmiStoppedForIdle && !utils.IsHdmiDisabled() {
			resumeHdmiCaptureLocked()
		}
		hdmiStoppedForIdle = false
		return
	}

	scheduleHdmiIdleTimerLocked()
}

func stopHdmiIdleTimerLocked() {
	if hdmiIdleTimer != nil {
		hdmiIdleTimer.Stop()
		hdmiIdleTimer = nil
	}
}

func scheduleHdmiIdleTimerLocked() {
	if hdmiViewerCount != 0 || hdmiStoppedForIdle || utils.IsHdmiDisabled() {
		return
	}

	minutes := utils.GetHDMIIdleTimeout()
	if minutes == 0 {
		return
	}

	generation := hdmiIdleGeneration
	hdmiIdleTimer = time.AfterFunc(time.Duration(minutes)*time.Minute, func() {
		hdmiMutex.Lock()
		defer hdmiMutex.Unlock()

		if generation != hdmiIdleGeneration || hdmiViewerCount != 0 || utils.IsHdmiDisabled() {
			return
		}

		hdmiIdleTimer = nil
		common.GetKvmVision().SetHDMI(false)
		hdmiStoppedForIdle = true
		log.Debugf("disabled hdmi capture after %d minutes without viewers", minutes)
	})
}

func resumeHdmiCaptureLocked() {
	common.GetKvmVision().SetHDMI(false)
	time.Sleep(1 * time.Second)
	common.GetKvmVision().SetHDMI(true)
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	log.Debug("resumed hdmi capture after viewer connected")
}

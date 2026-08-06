package vm

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/proto"
	hdmistate "NanoKVM-Server/service/vm/hdmi_state"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	hdmiCaptureWarmupDuration = time.Second
	hdmiStateFile             = "/kvmapp/kvm/state"
)

var (
	hdmiMutex           sync.Mutex
	hdmiCaptureReadSlot = make(chan struct{}, 1)
	hdmiIdleTimer       *time.Timer
	hdmiIdleGeneration  uint64
	hdmiDemand          = hdmistate.New()
	hdmiStoppedForIdle  bool

	setHDMI            = func(enabled bool) { common.GetKvmVision().SetHDMI(enabled) }
	isHdmiDisabled     = utils.IsHdmiDisabled
	getHdmiIdleTimeout = utils.GetHDMIIdleTimeout
	readHdmiStateFile  = func() ([]byte, error) { return os.ReadFile(hdmiStateFile) }
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

	signal, err := getHdmiSignal()
	if err != nil {
		log.WithError(err).Error("failed to read hdmi signal state")
		rsp.ErrRsp(c, -1, "failed to get hdmi state")
		return
	}

	rsp.OkRspWithData(c, &proto.GetGetHdmiStateRsp{
		Enabled:     !isHdmiDisabled(),
		Signal:      signal,
		IdleTimeout: getHdmiIdleTimeout(),
	})

	log.Debug("get hdmi state")
}

func getHdmiSignal() (bool, error) {
	data, err := readHdmiStateFile()
	if err != nil {
		return false, err
	}

	switch strings.TrimSpace(string(data)) {
	case "1":
		return true, nil
	case "0":
		return false, nil
	default:
		return false, fmt.Errorf("invalid hdmi signal state: %q", string(data))
	}
}

func EnableHdmiCapture() {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	setHDMI(true)
	hdmiDemand.MarkWarming(time.Now().Add(hdmiCaptureWarmupDuration))
	hdmiStoppedForIdle = false
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	scheduleHdmiIdleTimerLocked()
}

func DisableHdmiCapture() {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	setHDMI(false)
	hdmiDemand.ClearReadyAt()
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
	if minutes < 0 || minutes > utils.MaxHDMIIdleTimeoutMinutes {
		return
	}

	utils.PersistHDMIIdleTimeout(minutes)

	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	if hdmiStoppedForIdle && !isHdmiDisabled() {
		resumeHdmiCaptureLocked()
		hdmiStoppedForIdle = false
	}
	if !hdmiDemand.HasDemand() && !hdmiStoppedForIdle {
		scheduleHdmiIdleTimerLocked()
	}
}

func SetHdmiViewerCount(count int) {
	SetHdmiViewerCountForSource("legacy", count)
}

// SetHdmiViewerCountForSource is retained for callers that cannot provide a
// source revision. Streamers should use UpdateHdmiViewerSnapshot instead.
func SetHdmiViewerCountForSource(source string, count int) {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	version := hdmiDemand.NextVersion(source)
	updateHdmiViewerSnapshotLocked(source, count, version)
}

// UpdateHdmiViewerSnapshot applies a source's authoritative client count.
// Revisions let streamers report after releasing their own client-map locks
// without allowing an older count to overwrite a newer one.
func UpdateHdmiViewerSnapshot(source string, count int, version uint64) {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	updateHdmiViewerSnapshotLocked(source, count, version)
}

func updateHdmiViewerSnapshotLocked(source string, count int, version uint64) {
	if count < 0 {
		count = 0
	}

	if !hdmiDemand.UpdateViewer(source, count, version) {
		return
	}
	reconcileHdmiCaptureDemandLocked()
}

// AcquireHdmiCaptureLease prevents idle shutdown while a short-lived capture
// consumer, such as an MCP screenshot, is active. The returned release is
// safe to call more than once.
func AcquireHdmiCaptureLease() func() {
	release, _ := acquireHdmiCaptureLease()
	return release
}

// AcquireHdmiCaptureLeaseForRead keeps capture active and waits outside
// hdmiMutex until a capture resumed from idle has had time to produce a new
// frame. The returned claim function is consumed only by the first successful
// reader, so concurrent readers do not all discard a frame.
func AcquireHdmiCaptureLeaseForRead(ctx context.Context) (func(), func() bool, error) {
	release, readyAt := acquireHdmiCaptureLease()
	if wait := time.Until(readyAt); wait > 0 {
		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			timer.Stop()
			release()
			return nil, nil, ctx.Err()
		case <-timer.C:
		}
	}
	select {
	case hdmiCaptureReadSlot <- struct{}{}:
	case <-ctx.Done():
		release()
		return nil, nil, ctx.Err()
	}

	var releaseReadOnce sync.Once
	releaseRead := func() {
		releaseReadOnce.Do(func() {
			<-hdmiCaptureReadSlot
			release()
		})
	}

	hdmiMutex.Lock()
	needsFreshFrame := hdmiDemand.NeedsFreshFrame()
	hdmiMutex.Unlock()
	if !needsFreshFrame {
		return releaseRead, nil, nil
	}
	claimFresh := func() bool {
		hdmiMutex.Lock()
		claimed := hdmiDemand.ClaimFreshFrame()
		hdmiMutex.Unlock()
		return claimed
	}
	return releaseRead, claimFresh, nil
}

func acquireHdmiCaptureLease() (func(), time.Time) {
	hdmiMutex.Lock()
	hdmiDemand.AcquireLease()
	reconcileHdmiCaptureDemandLocked()
	readyAt := hdmiDemand.ReadyAt()
	hdmiMutex.Unlock()

	var once sync.Once
	release := func() {
		once.Do(func() {
			hdmiMutex.Lock()
			defer hdmiMutex.Unlock()

			if !hdmiDemand.ReleaseLease() {
				return
			}
			reconcileHdmiCaptureDemandLocked()
		})
	}
	return release, readyAt
}

func reconcileHdmiCaptureDemandLocked() {
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()

	if hdmiHasCaptureDemandLocked() {
		if hdmiStoppedForIdle && !isHdmiDisabled() {
			resumeHdmiCaptureLocked()
		}
		hdmiStoppedForIdle = false
		return
	}

	scheduleHdmiIdleTimerLocked()
}

func hdmiHasCaptureDemandLocked() bool {
	return hdmiDemand.HasDemand()
}

func stopHdmiIdleTimerLocked() {
	if hdmiIdleTimer != nil {
		hdmiIdleTimer.Stop()
		hdmiIdleTimer = nil
	}
}

func scheduleHdmiIdleTimerLocked() {
	if hdmiHasCaptureDemandLocked() || hdmiStoppedForIdle || isHdmiDisabled() {
		return
	}

	minutes := getHdmiIdleTimeout()
	if minutes == 0 {
		return
	}

	generation := hdmiIdleGeneration
	hdmiIdleTimer = time.AfterFunc(time.Duration(minutes)*time.Minute, func() {
		hdmiMutex.Lock()
		defer hdmiMutex.Unlock()

		if generation != hdmiIdleGeneration || hdmiHasCaptureDemandLocked() || isHdmiDisabled() {
			return
		}

		hdmiIdleTimer = nil
		setHDMI(false)
		hdmiDemand.ClearReadyAt()
		hdmiStoppedForIdle = true
		log.Debugf("disabled hdmi capture after %d minutes without viewers", minutes)
	})
}

func resumeHdmiCaptureLocked() {
	setHDMI(true)
	hdmiDemand.MarkWarming(time.Now().Add(hdmiCaptureWarmupDuration))
	log.Debug("resumed hdmi capture after viewer connected")
}

package vm

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/hardware/lontium"
	"NanoKVM-Server/proto"
	hdmistate "NanoKVM-Server/service/vm/hdmi_state"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	hdmiCaptureReadyTimeout = 5 * time.Second
	hdmiCapturePollInterval = 50 * time.Millisecond
)

var (
	hdmiMutex             sync.Mutex
	hdmiCaptureReadSlot   = make(chan struct{}, 1)
	hdmiIdleTimer         *time.Timer
	hdmiIdleGeneration    uint64
	hdmiCaptureGeneration uint64
	hdmiDemand            = hdmistate.New()
	hdmiStoppedForIdle    bool

	setHDMI            = func(enabled bool) error { return common.GetKvmVision().SetHDMI(enabled) }
	readHdmiStatus     = lontium.ReadStatus
	getHdmiCapture     = func() (int, uint64, error) { return common.GetKvmVision().CaptureState() }
	isHdmiDisabled     = utils.IsHdmiDisabled
	getHdmiIdleTimeout = utils.GetHDMIIdleTimeout
	persistHdmiEnabled = func(enabled bool) error {
		if enabled {
			return utils.PersistHDMIEnabled()
		}
		return utils.PersistHDMIDisabled()
	}
	persistHdmiIdleTimeout = utils.PersistHDMIIdleTimeout
)

func (s *Service) ResetHdmi(c *gin.Context) {
	var rsp proto.Response
	if err := setHdmiPreference(true, true); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	rsp.OkRsp(c)
}

func (s *Service) EnableHdmi(c *gin.Context) {
	var rsp proto.Response
	if err := setHdmiPreference(true, false); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	rsp.OkRsp(c)
}

func (s *Service) DisableHdmi(c *gin.Context) {
	var rsp proto.Response
	if err := setHdmiPreference(false, false); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	rsp.OkRsp(c)
}

// Serialize the saved preference with power commands. If the command fails,
// restore the prior preference; an unsupported switch must not report success.
func setHdmiPreference(enabled, reset bool) error {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()

	previous := !isHdmiDisabled()
	if err := persistHdmiEnabled(enabled); err != nil {
		return fmt.Errorf("save HDMI preference: %w", err)
	}
	var err error
	if enabled && !reset {
		err = enableHdmiCaptureLocked()
	} else {
		err = disableHdmiCaptureLocked()
	}
	if err != nil {
		if rollbackErr := persistHdmiEnabled(previous); rollbackErr != nil {
			err = errors.Join(err, fmt.Errorf("restore HDMI preference: %w", rollbackErr))
		}
		return err
	}
	if reset {
		// An explicit reset holds the receiver off. Normal startup and wake
		// only request power on and wait for measured readiness.
		time.Sleep(time.Second)
		return enableHdmiCaptureLocked()
	}
	return nil
}

func (s *Service) GetHdmiState(c *gin.Context) {
	var rsp proto.Response
	hdmiMutex.Lock()
	data := &proto.GetGetHdmiStateRsp{
		Enabled: !isHdmiDisabled(), IdleTimeout: getHdmiIdleTimeout(),
	}
	status, err := readHdmiStatus()
	hdmiMutex.Unlock()
	if err != nil {
		data.ReadError = err.Error()
		rsp.Data = data
		rsp.ErrRsp(c, -1, "failed to read HDMI receiver status")
		return
	}
	data.Receiver = &status
	data.Signal = status.HasVideo()
	result, sequence, err := getHdmiCapture()
	if err != nil {
		data.ReadError = err.Error()
		rsp.Data = data
		rsp.ErrRsp(c, -1, "failed to read capture state")
		return
	}
	data.Capture = &proto.HDMICaptureState{
		State: captureStateName(result, sequence, status), Result: result, ReceiverSequence: sequence,
	}
	rsp.OkRspWithData(c, data)
}

func captureStateName(result int, sequence uint64, status lontium.Status) string {
	// A failed read has no receiver sequence; retain the actual SDK/read
	// failure instead of disguising it as a pending timing update.
	if result == -7 {
		return "input-error"
	}
	if result != 0 && result != -1 && result != -4 && result != -6 {
		return "error"
	}
	if sequence != status.Sequence {
		return "configuring"
	}
	switch result {
	case 0:
		if status.HasVideo() {
			return "ready"
		}
		return "inactive"
	case -1:
		return "inactive"
	case -4:
		return "configuring"
	case -6:
		return "unsupported"
	default:
		return "error"
	}
}

func EnableHdmiCapture() error {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	return enableHdmiCaptureLocked()
}

func enableHdmiCaptureLocked() error {
	hdmiCaptureGeneration++
	if err := setHDMI(true); err != nil {
		return fmt.Errorf("enable HDMI: %w", err)
	}
	hdmiDemand.RequireFreshFrame()
	hdmiStoppedForIdle = false
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	scheduleHdmiIdleTimerLocked()
	return nil
}

func DisableHdmiCapture() error {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	return disableHdmiCaptureLocked()
}

func disableHdmiCaptureLocked() error {
	hdmiCaptureGeneration++
	if err := setHDMI(false); err != nil {
		return fmt.Errorf("disable HDMI: %w", err)
	}
	hdmiDemand.ClearFreshFrame()
	hdmiStoppedForIdle = false
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	return nil
}

func (s *Service) SetHdmiIdleTimeout(c *gin.Context) {
	var req proto.SetHdmiIdleTimeoutReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	if err := SetHdmiIdleTimeout(req.Minutes); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	rsp.OkRsp(c)
}

func SetHdmiIdleTimeout(minutes int) error {
	if minutes < 0 || minutes > utils.MaxHDMIIdleTimeoutMinutes {
		return errors.New("invalid HDMI idle timeout")
	}
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	previous := getHdmiIdleTimeout()
	if err := persistHdmiIdleTimeout(minutes); err != nil {
		return fmt.Errorf("save HDMI idle timeout: %w", err)
	}
	if hdmiStoppedForIdle && !isHdmiDisabled() {
		if err := enableHdmiCaptureLocked(); err != nil {
			return errors.Join(err, persistHdmiIdleTimeout(previous))
		}
	}
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	scheduleHdmiIdleTimerLocked()
	return nil
}

func SetHdmiViewerCount(count int) { SetHdmiViewerCountForSource("legacy", count) }

func SetHdmiViewerCountForSource(source string, count int) {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	updateHdmiViewerSnapshotLocked(source, count, hdmiDemand.NextVersion(source))
}

// Revisions keep an older client-map snapshot from overwriting a newer one.
func UpdateHdmiViewerSnapshot(source string, count int, version uint64) {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	updateHdmiViewerSnapshotLocked(source, count, version)
}

func updateHdmiViewerSnapshotLocked(source string, count int, version uint64) {
	if !hdmiDemand.UpdateViewer(source, count, version) {
		return
	}
	if err := reconcileHdmiCaptureDemandLocked(); err != nil {
		log.WithError(err).Error("resume HDMI for viewer")
	}
}

// AcquireHdmiCaptureLease prevents idle shutdown for a long-lived task.
// Read leases additionally return wake errors and wait for capture readiness.
func AcquireHdmiCaptureLease() func() {
	release, err := acquireHdmiCaptureLease()
	if err != nil {
		log.WithError(err).Error("resume HDMI for capture task")
	}
	return release
}

// AcquireHdmiCaptureLeaseForRead serializes screenshot readers and waits for
// both confirmed CSI and capture configuration of that exact kernel snapshot.
// The bounded wait is cancellable and never holds hdmiMutex across a wait.
func AcquireHdmiCaptureLeaseForRead(ctx context.Context) (hdmistate.ReadLease, error) {
	ctx, cancel := context.WithTimeout(ctx, hdmiCaptureReadyTimeout)
	defer cancel()
	if err := ctx.Err(); err != nil {
		return hdmistate.ReadLease{}, err
	}
	release, err := acquireHdmiCaptureLease()
	if err != nil {
		release()
		return hdmistate.ReadLease{}, err
	}
	select {
	case hdmiCaptureReadSlot <- struct{}{}:
	case <-ctx.Done():
		release()
		return hdmistate.ReadLease{}, ctx.Err()
	}
	var once sync.Once
	releaseRead := func() { once.Do(func() { <-hdmiCaptureReadSlot; release() }) }
	ready, err := waitHdmiCaptureReady(ctx)
	if err != nil {
		releaseRead()
		return hdmistate.ReadLease{}, err
	}
	claimFresh := func() bool {
		hdmiMutex.Lock()
		defer hdmiMutex.Unlock()
		return ready.generation == hdmiCaptureGeneration && hdmiDemand.ClaimFreshFrame()
	}
	return hdmistate.ReadLease{
		Width: ready.width, Height: ready.height,
		Release: releaseRead, ClaimFresh: claimFresh,
	}, nil
}

type readyHdmiCapture struct {
	generation uint64
	width      uint16
	height     uint16
}

func waitHdmiCaptureReady(ctx context.Context) (readyHdmiCapture, error) {
	ticker := time.NewTicker(hdmiCapturePollInterval)
	defer ticker.Stop()
	lastState := "unknown"
	for {
		if err := ctx.Err(); err != nil {
			return readyHdmiCapture{}, fmt.Errorf("HDMI capture not ready (%s): %w", lastState, err)
		}
		hdmiMutex.Lock()
		disabled, generation := isHdmiDisabled(), hdmiCaptureGeneration
		hdmiMutex.Unlock()
		if disabled {
			return readyHdmiCapture{}, errors.New("HDMI is disabled")
		}
		status, err := readHdmiStatus()
		if err != nil {
			return readyHdmiCapture{}, fmt.Errorf("read HDMI receiver: %w", err)
		}
		result, sequence, err := getHdmiCapture()
		if err != nil {
			return readyHdmiCapture{}, fmt.Errorf("read HDMI capture: %w", err)
		}
		hdmiMutex.Lock()
		current := generation == hdmiCaptureGeneration
		hdmiMutex.Unlock()
		if !current {
			continue
		}
		if status.Signal == lontium.Off {
			return readyHdmiCapture{}, errors.New("HDMI receiver is powered off")
		}
		if status.Signal == lontium.Error {
			return readyHdmiCapture{}, fmt.Errorf("HDMI receiver error %d", status.Error)
		}
		lastState = string(status.Signal)
		if status.HasVideo() {
			lastState = captureStateName(result, sequence, status)
			if lastState == "ready" {
				width, height := status.VideoSize()
				if width != 0 && height != 0 {
					return readyHdmiCapture{generation: generation, width: width, height: height}, ctx.Err()
				}
				lastState = "unsupported"
			}
			if lastState == "unsupported" {
				return readyHdmiCapture{}, fmt.Errorf("unsupported CSI capture size %dx%d", status.CSI.Width, status.CSI.Height)
			}
		}
		select {
		case <-ctx.Done():
			return readyHdmiCapture{}, fmt.Errorf("HDMI capture not ready (%s): %w", lastState, ctx.Err())
		case <-ticker.C:
		}
	}
}

func acquireHdmiCaptureLease() (func(), error) {
	hdmiMutex.Lock()
	hdmiDemand.AcquireLease()
	err := reconcileHdmiCaptureDemandLocked()
	hdmiMutex.Unlock()
	var once sync.Once
	release := func() {
		once.Do(func() {
			hdmiMutex.Lock()
			defer hdmiMutex.Unlock()
			if hdmiDemand.ReleaseLease() {
				if err := reconcileHdmiCaptureDemandLocked(); err != nil {
					log.WithError(err).Error("reconcile HDMI capture lease")
				}
			}
		})
	}
	return release, err
}

func reconcileHdmiCaptureDemandLocked() error {
	hdmiIdleGeneration++
	stopHdmiIdleTimerLocked()
	if hdmiDemand.HasDemand() {
		if hdmiStoppedForIdle && !isHdmiDisabled() {
			return enableHdmiCaptureLocked()
		}
		return nil
	}
	scheduleHdmiIdleTimerLocked()
	return nil
}

func stopHdmiIdleTimerLocked() {
	if hdmiIdleTimer != nil {
		hdmiIdleTimer.Stop()
		hdmiIdleTimer = nil
	}
}

func scheduleHdmiIdleTimerLocked() {
	if hdmiDemand.HasDemand() || hdmiStoppedForIdle || isHdmiDisabled() {
		return
	}
	minutes := getHdmiIdleTimeout()
	if minutes == 0 {
		return
	}
	generation := hdmiIdleGeneration
	hdmiIdleTimer = time.AfterFunc(time.Duration(minutes)*time.Minute, func() {
		stopIdleHdmiCapture(generation, minutes)
	})
}

func stopIdleHdmiCapture(generation uint64, minutes int) {
	hdmiMutex.Lock()
	defer hdmiMutex.Unlock()
	if generation != hdmiIdleGeneration || hdmiDemand.HasDemand() || isHdmiDisabled() {
		return
	}
	hdmiIdleTimer = nil
	if err := disableHdmiCaptureLocked(); err != nil {
		log.WithError(err).Error("disable idle HDMI capture")
		return
	}
	hdmiStoppedForIdle = true
	log.Debugf("disabled HDMI capture after %d minutes without viewers", minutes)
}

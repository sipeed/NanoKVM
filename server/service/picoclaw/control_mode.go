package picoclaw

import (
	"errors"
	"fmt"
	"time"

	log "github.com/sirupsen/logrus"
)

func (s *Service) PreemptForMCP() error {
	if err := s.PreemptControlLeasesForMCP(); err != nil {
		return err
	}
	return s.StopRuntimeForMCP()
}

func (s *Service) PreemptControlLeasesForMCP() error {
	startedAt := time.Now()
	if s == nil {
		return fmt.Errorf("picoclaw service is unavailable")
	}
	s.ensureDependencies()

	activeOperations := s.CancelActiveControlOperations()
	closedSessions := s.ReleaseControlSessions(
		CloseCodeControlModeSwitched,
		"external MCP enabled",
	)
	log.WithFields(log.Fields{
		"active_operations": activeOperations,
		"closed_sessions":   closedSessions,
		"elapsed_ms":        time.Since(startedAt).Milliseconds(),
	}).Info("picoclaw control leases preempted for MCP")
	return nil
}

func (s *Service) StopRuntimeForMCP() error {
	startedAt := time.Now()
	if s == nil {
		return fmt.Errorf("picoclaw service is unavailable")
	}
	s.ensureDependencies()

	currentStatus := s.runtime.Get()
	statusRequiresStop :=
		currentStatus.Ready ||
			currentStatus.Status == "ready" ||
			isRuntimeLifecycleStatusPending(currentStatus)
	running, runningErr := isRuntimeRunning()
	if runningErr != nil {
		if !statusRequiresStop {
			log.WithFields(log.Fields{
				"status":     currentStatus.Status,
				"ready":      currentStatus.Ready,
				"elapsed_ms": time.Since(startedAt).Milliseconds(),
			}).WithError(runningErr).Warn("skipping PicoClaw runtime stop for MCP because runtime is not active")
			s.setRuntimeIntentDesired(false, "mcp_preempt")
			return nil
		}
		return fmt.Errorf("check PicoClaw runtime for MCP: %w", runningErr)
	}
	if !running && !statusRequiresStop {
		s.setRuntimeIntentDesired(false, "mcp_preempt")
		log.WithFields(log.Fields{
			"status":     currentStatus.Status,
			"ready":      currentStatus.Ready,
			"elapsed_ms": time.Since(startedAt).Milliseconds(),
		}).Info("PicoClaw runtime stop skipped for MCP because runtime is not active")
		return nil
	}

	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Restoring = false
		status.Status = "stopping"
		status.LastError = ""
		status.CheckedAt = time.Now()
	})
	if err := s.stopRuntimeAndVerify(false); err != nil {
		log.WithFields(log.Fields{
			"elapsed_ms": time.Since(startedAt).Milliseconds(),
		}).WithError(err).Warn("picoclaw stop runtime for MCP failed")
		return fmt.Errorf("stop PicoClaw runtime for MCP: %w", err)
	}
	s.setRuntimeIntentDesired(false, "mcp_preempt")
	log.WithFields(log.Fields{
		"elapsed_ms": time.Since(startedAt).Milliseconds(),
	}).Info("picoclaw runtime stopped for MCP")
	return nil
}

func (s *Service) CompleteControlRelease(source string, closeCode int, closeReason string) int {
	if s == nil {
		return 0
	}
	s.ensureDependencies()
	unlockLifecycle := s.lockRuntimeLifecycle()
	defer unlockLifecycle()

	s.CancelActiveControlOperations()
	s.setRuntimeIntentDesired(false, source)
	return s.ReleaseControlSessions(closeCode, closeReason)
}

func (s *Service) PreserveRuntimeForChatOnly(source string) {
	if s == nil {
		return
	}
	s.ensureDependencies()

	status := s.runtime.Get()
	if !status.Ready && len(GetSessionManager().Snapshot()) == 0 {
		return
	}
	s.setRuntimeIntentDesired(true, source)
}

func (s *Service) RuntimeStatus() RuntimeStatus {
	if s == nil {
		return RuntimeStatus{
			Ready:       false,
			Installed:   false,
			InstallPath: picoclawBinaryPath,
			Status:      "unavailable",
		}
	}
	return s.runtimeStatus()
}

func (s *Service) stopForRuntimeStop() error {
	s.ensureDependencies()
	return s.stopRuntimeAndCloseSessions(
		CloseCodeRuntimeStopped,
		"PicoClaw runtime stopped",
	)
}

func (s *Service) stopRuntimeAndCloseSessions(closeCode int, closeReason string) error {
	if s == nil {
		return nil
	}
	s.ensureDependencies()
	startedAt := time.Now()
	sessions := GetSessionManager().Snapshot()
	for _, session := range sessions {
		s.closeGatewaySession(session, closeCode, closeReason)
	}
	closeElapsed := time.Since(startedAt)
	if s.lock != nil {
		s.lock.Release("")
	}

	stopStartedAt := time.Now()
	if err := s.stopRuntimeAndVerify(false); err != nil {
		log.WithFields(log.Fields{
			"session_count":     len(sessions),
			"close_code":        closeCode,
			"close_sessions_ms": closeElapsed.Milliseconds(),
			"stop_runtime_ms":   time.Since(stopStartedAt).Milliseconds(),
			"total_ms":          time.Since(startedAt).Milliseconds(),
		}).WithError(err).Warn("picoclaw stop runtime and close sessions failed")
		return err
	}

	log.WithFields(log.Fields{
		"session_count":     len(sessions),
		"close_code":        closeCode,
		"close_sessions_ms": closeElapsed.Milliseconds(),
		"stop_runtime_ms":   time.Since(stopStartedAt).Milliseconds(),
		"total_ms":          time.Since(startedAt).Milliseconds(),
	}).Info("picoclaw runtime stopped and gateway sessions closed")
	return nil
}

func (s *Service) ReleaseControlSessions(closeCode int, closeReason string) int {
	if s == nil {
		return 0
	}
	s.ensureDependencies()
	startedAt := time.Now()
	sessions := GetSessionManager().Snapshot()
	for _, session := range sessions {
		s.closeGatewaySession(session, closeCode, closeReason)
	}
	if s.lock != nil {
		s.lock.Release("")
	}
	log.WithFields(log.Fields{
		"session_count": len(sessions),
		"close_code":    closeCode,
		"elapsed_ms":    time.Since(startedAt).Milliseconds(),
	}).Info("picoclaw gateway sessions closed for control release")
	return len(sessions)
}

func (s *Service) stopRuntimeAndVerify(forceStop bool) error {
	if s == nil {
		return fmt.Errorf("picoclaw service is unavailable")
	}
	s.ensureDependencies()
	err := stopRuntimeProcessAndVerify(
		forceStop,
		isRuntimeRunning,
		func() error {
			_, _, stopErr := s.stopRuntime()
			return stopErr
		},
		picoclawStopTimeout,
		100*time.Millisecond,
	)
	if err != nil {
		return err
	}

	s.runtime.Update(func(status *RuntimeStatus) {
		status.Ready = false
		status.Status = "stopped"
		status.CurrentSession = ""
		status.CheckedAt = time.Now()
	})
	return nil
}

func stopRuntimeProcessAndVerify(
	forceStop bool,
	isRunning func() (bool, error),
	stop func() error,
	timeout time.Duration,
	pollInterval time.Duration,
) error {
	if !forceStop {
		running, err := isRunning()
		if err != nil {
			return fmt.Errorf("check PicoClaw runtime: %w", err)
		}
		if !running {
			return nil
		}
	}

	var stopErr error
	if err := stop(); err != nil {
		stopErr = fmt.Errorf("stop PicoClaw runtime: %w", err)
	}

	deadline := time.Now().Add(timeout)
	for {
		running, err := isRunning()
		if err != nil {
			return errors.Join(stopErr, fmt.Errorf("verify PicoClaw stopped: %w", err))
		}
		if !running {
			if stopErr != nil {
				log.Warnf("PicoClaw stop command returned an error after the runtime stopped: %v", stopErr)
			}
			return nil
		}
		if !time.Now().Before(deadline) {
			return errors.Join(stopErr, fmt.Errorf("PicoClaw runtime is still running"))
		}
		time.Sleep(pollInterval)
	}
}

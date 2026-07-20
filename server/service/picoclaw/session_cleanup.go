package picoclaw

import (
	"os"
	"path/filepath"

	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"

	log "github.com/sirupsen/logrus"
)

const picoclawMediaTempDirName = "picoclaw_media"

func ReleaseSession(sessionID string) {
	_, err := releaseOwnedSession(GetSessionLock(), sessionID, hid.ReleaseAllHIDState)
	if err != nil {
		log.Errorf("failed to release HID state for PicoClaw session %s: %v", sessionID, err)
	}
}

func (s *Service) releaseGatewaySession(sessionID string) {
	if s == nil {
		ReleaseSession(sessionID)
		return
	}
	s.ensureDependencies()
	releaseHID := s.releaseHID
	if s.control.Current() != controlmode.ModePicoclaw {
		releaseHID = nil
	}
	if _, err := releaseOwnedSession(s.lock, sessionID, releaseHID); err != nil {
		log.Errorf("failed to release HID state for PicoClaw session %s: %v", sessionID, err)
	}
}

func releaseOwnedSession(lock *SessionLock, sessionID string, releaseHID func() error) (bool, error) {
	if lock == nil || !lock.ReleaseOwned(sessionID) {
		return false, nil
	}
	if releaseHID == nil {
		return true, nil
	}
	return true, releaseHID()
}

func (s *Service) releaseAllHIDState() {
	s.hid.WriteHid0([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
	s.hid.WriteHid1([]byte{0x00, 0x00, 0x00, 0x00})
	s.hid.WriteHid2([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
}

func picoclawMediaTempDir() string {
	return filepath.Join(os.TempDir(), picoclawMediaTempDirName)
}

func cleanupPicoclawMediaTempDir() {
	mediaDir := picoclawMediaTempDir()

	if _, err := os.Stat(mediaDir); err != nil {
		if !os.IsNotExist(err) {
			log.Warnf("failed to stat picoclaw media directory %s: %v", mediaDir, err)
		}
		return
	}

	if err := os.RemoveAll(mediaDir); err != nil {
		log.Warnf("failed to remove picoclaw media directory %s: %v", mediaDir, err)
		return
	}

	log.Infof("removed picoclaw media directory %s", mediaDir)
}

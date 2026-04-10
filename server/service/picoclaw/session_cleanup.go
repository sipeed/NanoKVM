package picoclaw

import (
	"os"
	"path/filepath"

	"NanoKVM-Server/service/hid"

	log "github.com/sirupsen/logrus"
)

const picoclawMediaTempDirName = "picoclaw_media"

func ReleaseSession(sessionID string) {
	GetSessionLock().Release(sessionID)
	releaseAllHIDState()
}

func releaseAllHIDState() {
	h := hid.GetHid()
	h.WriteHid0([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
	h.WriteHid1([]byte{0x00, 0x00, 0x00, 0x00})
	h.WriteHid2([]byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
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

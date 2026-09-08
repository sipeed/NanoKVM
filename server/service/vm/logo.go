package vm

import (
	"bytes"
	"io"
	"os"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// The web UI serves /sipeed.ico from <execDir>/web (i.e. /kvmapp/server/web/).
// Uploads persist to /boot/logo.ico (survives app updates; S95nanokvm applies
// it at boot) and are copied to the served location immediately.

const (
	LogoFile    = "/boot/logo.ico"
	WebLogoFile = "/kvmapp/server/web/sipeed.ico"
	WebLogoOrig = "/kvmapp/server/web/original.ico"
	maxLogoSize = 1 << 20 // 1 MiB
)

func (s *Service) SetLogo(c *gin.Context) {
	var rsp proto.Response

	file, err := c.FormFile("file")
	if err != nil {
		rsp.ErrRsp(c, -1, "no file uploaded")
		return
	}
	if file.Size > maxLogoSize {
		rsp.ErrRsp(c, -2, "logo too large (max 1 MiB)")
		return
	}

	src, err := file.Open()
	if err != nil {
		rsp.ErrRsp(c, -3, "failed to open upload")
		return
	}
	defer src.Close()

	header := make([]byte, 16)
	n, _ := io.ReadFull(src, header)
	if !looksLikeImage(header[:n]) {
		rsp.ErrRsp(c, -4, "not a supported image (png/jpg/gif/svg/ico)")
		return
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		rsp.ErrRsp(c, -5, "failed to rewind upload")
		return
	}

	data, err := io.ReadAll(src)
	if err != nil {
		rsp.ErrRsp(c, -6, "failed to read upload")
		return
	}

	// Preserve the default logo once so reset can restore it.
	if _, err := os.Stat(WebLogoOrig); err != nil {
		_ = copyFile(WebLogoFile, WebLogoOrig)
	}

	// Persist across app updates + apply immediately.
	if err := os.WriteFile(LogoFile, data, 0o644); err != nil {
		log.Errorf("failed to write %s: %s", LogoFile, err)
		rsp.ErrRsp(c, -7, "failed to save logo")
		return
	}
	if err := os.WriteFile(WebLogoFile, data, 0o644); err != nil {
		log.Errorf("failed to write %s: %s", WebLogoFile, err)
		rsp.ErrRsp(c, -8, "failed to apply logo")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("logo updated")
}

func (s *Service) ResetLogo(c *gin.Context) {
	var rsp proto.Response

	_ = os.Remove(LogoFile)
	if _, err := os.Stat(WebLogoOrig); err == nil {
		_ = copyFile(WebLogoOrig, WebLogoFile)
	}

	rsp.OkRsp(c)
	log.Debugf("logo reset")
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o644)
}

func looksLikeImage(header []byte) bool {
	switch {
	case len(header) >= 8 && bytes.Equal(header[:8], []byte("\x89PNG\r\n\x1a\n")):
		return true
	case len(header) >= 3 && bytes.Equal(header[:3], []byte{0xff, 0xd8, 0xff}):
		return true
	case len(header) >= 4 && bytes.Equal(header[:4], []byte("GIF8")):
		return true
	case len(header) >= 4 && bytes.Equal(header[:4], []byte{0x00, 0x00, 0x01, 0x00}):
		return true // ICO
	case len(header) >= 4 && bytes.Equal(header[:4], []byte("<svg")):
		return true
	case len(header) >= 5 && bytes.Equal(header[:5], []byte("<?xml")):
		return true // SVG with XML prolog
	}
	return false
}

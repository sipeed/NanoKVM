package stream

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (s *Service) Mjpeg(c *gin.Context) {
	mjpegURL := "http://127.0.0.1:8000/stream"

	resp, err := http.Get(mjpegURL)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to connect to MJPEG server")
		return
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		c.String(resp.StatusCode, "MJPEG server returned an error")
		return
	}

	c.Header("Content-Type", resp.Header.Get("Content-Type"))

	_, err = io.Copy(c.Writer, resp.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to copy MJPEG stream")
		return
	}
}

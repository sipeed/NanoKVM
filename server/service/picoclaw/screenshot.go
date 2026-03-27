package picoclaw

import (
	"encoding/base64"
	"net/http"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/service/stream/mjpeg"

	"github.com/gin-gonic/gin"
)

var screenshotRetryDelay = 100 * time.Millisecond

const (
	screenshotRetryCount       = 3
	cachedFrameMaxAge          = 2 * time.Second
	defaultPicoclawScreenshotWidth   = 960
	defaultPicoclawScreenshotHeight  = 540
	defaultPicoclawScreenshotQuality = 60
)

func (s *Service) Screenshot(c *gin.Context) {
	var query ScreenshotQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid screenshot query"))
		return
	}

	_, sessionErr := s.requireSessionID(c)
	if sessionErr != nil {
		writePicoclawError(c, sessionErr)
		return
	}

	data, meta, err := s.captureScreenshot(query)
	if err != nil {
		writePicoclawError(c, err)
		return
	}

	if query.Format == "base64" {
		meta.ImageBase64 = base64.StdEncoding.EncodeToString(data)
		writeSuccess(c, meta)
		return
	}

	c.Data(http.StatusOK, "image/jpeg", data)
}

func (s *Service) captureScreenshot(query ScreenshotQuery) ([]byte, ScreenshotMeta, *PicoclawError) {
	width, height, quality := resolveScreenshotRequest(query)

	if canUseCachedFrame(query) {
		if frame, ok := mjpeg.GetLatestFrame(); ok && time.Since(frame.CapturedAt) <= cachedFrameMaxAge {
			return frame.Data, ScreenshotMeta{
				SourceWidth:   frame.Width,
				SourceHeight:  frame.Height,
				CaptureWidth:  frame.Width,
				CaptureHeight: frame.Height,
				Format:        "jpeg",
			}, nil
		}
	}

	screen := common.GetScreen()
	common.CheckScreen()

	for attempt := 0; attempt < screenshotRetryCount; attempt++ {
		data, result := s.vision.ReadMjpeg(width, height, quality)
		switch {
		case result == 5:
			if attempt < screenshotRetryCount-1 {
				time.Sleep(screenshotRetryDelay)
				continue
			}
			return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotNoSignal, "no HDMI signal or frame unavailable")
		case result < 0 || len(data) == 0:
			return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "failed to capture screenshot")
		default:
			return data, ScreenshotMeta{
				SourceWidth:   screen.Width,
				SourceHeight:  screen.Height,
				CaptureWidth:  width,
				CaptureHeight: height,
				Format:        "jpeg",
			}, nil
		}
	}

	return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "failed to capture screenshot")
}

func canUseCachedFrame(query ScreenshotQuery) bool {
	return query.Width == 0 && query.Height == 0 && query.Quality == 0
}

func resolveScreenshotRequest(query ScreenshotQuery) (uint16, uint16, uint16) {
	screen := common.GetScreen()
	width := screen.Width
	height := screen.Height
	quality := screen.Quality

	if query.Format == "base64" {
		width, height = fitWithinBounds(width, height, defaultPicoclawScreenshotWidth, defaultPicoclawScreenshotHeight)
		if quality == 0 || quality > defaultPicoclawScreenshotQuality {
			quality = defaultPicoclawScreenshotQuality
		}
	}

	width, height = applyRequestedDimensions(width, height, query.Width, query.Height)
	if query.Quality > 0 {
		quality = query.Quality
	}

	return width, height, quality
}

func applyRequestedDimensions(defaultWidth uint16, defaultHeight uint16, requestedWidth uint16, requestedHeight uint16) (uint16, uint16) {
	switch {
	case requestedWidth > 0 && requestedHeight > 0:
		return requestedWidth, requestedHeight
	case requestedWidth > 0:
		return fitWithinBounds(defaultWidth, defaultHeight, requestedWidth, 0)
	case requestedHeight > 0:
		return fitWithinBounds(defaultWidth, defaultHeight, 0, requestedHeight)
	default:
		return defaultWidth, defaultHeight
	}
}

func fitWithinBounds(sourceWidth uint16, sourceHeight uint16, maxWidth uint16, maxHeight uint16) (uint16, uint16) {
	if sourceWidth == 0 || sourceHeight == 0 {
		return sourceWidth, sourceHeight
	}
	if maxWidth == 0 && maxHeight == 0 {
		return sourceWidth, sourceHeight
	}

	width := int(sourceWidth)
	height := int(sourceHeight)
	limitedWidth := width
	limitedHeight := height

	if maxWidth > 0 && limitedWidth > int(maxWidth) {
		limitedWidth = int(maxWidth)
		limitedHeight = height * limitedWidth / width
	}

	if maxHeight > 0 && limitedHeight > int(maxHeight) {
		limitedHeight = int(maxHeight)
		limitedWidth = width * limitedHeight / height
	}

	if limitedWidth <= 0 {
		limitedWidth = 1
	}
	if limitedHeight <= 0 {
		limitedHeight = 1
	}

	return uint16(limitedWidth), uint16(limitedHeight)
}

package picoclaw

import (
	"context"
	"encoding/base64"
	"net/http"
	"time"

	"NanoKVM-Server/common"

	"github.com/gin-gonic/gin"
)

var screenshotRetryDelay = 100 * time.Millisecond

const (
	screenshotRetryCount             = 30
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

	sessionID, sessionErr := s.requireSessionID(c)
	if sessionErr != nil {
		writePicoclawError(c, sessionErr)
		return
	}

	releaseAfter, lockErr := s.lock.AcquireTemporary(sessionID)
	if lockErr != nil {
		writePicoclawError(c, lockErr)
		return
	}
	if releaseAfter {
		defer s.lock.Release(sessionID)
	}

	data, meta, err := s.captureScreenshot(c.Request.Context(), query)
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

func (s *Service) captureScreenshot(ctx context.Context, query ScreenshotQuery) ([]byte, ScreenshotMeta, *PicoclawError) {
	width, height, quality := resolveScreenshotRequest(query)

	screen := common.GetScreen()
	common.CheckScreen()
	releaseLease, claimFresh, leaseErr := s.acquireCaptureLease(ctx)
	if leaseErr != nil {
		return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "screenshot capture canceled")
	}
	defer releaseLease()

	for attempt := 0; attempt < screenshotRetryCount; attempt++ {
		if err := ctx.Err(); err != nil {
			return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "screenshot capture canceled")
		}
		data, result := s.vision.ReadMjpeg(width, height, quality)
		switch {
		case result == 5 || result == -3 || result == -4 || result == -5:
			if attempt < screenshotRetryCount-1 {
				timer := time.NewTimer(screenshotRetryDelay)
				select {
				case <-ctx.Done():
					timer.Stop()
					return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "screenshot capture canceled")
				case <-timer.C:
				}
				continue
			}
			return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotNoSignal, "no HDMI signal or frame unavailable")
		case result < 0 || len(data) == 0:
			return nil, ScreenshotMeta{}, newPicoclawError(CodeScreenshotFailed, "failed to capture screenshot")
		default:
			if claimFresh != nil && claimFresh() {
				claimFresh = nil
				continue
			}
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

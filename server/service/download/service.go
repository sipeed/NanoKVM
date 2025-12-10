package download

import (
	"NanoKVM-Server/proto"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Service struct{}

var sentinelPath = "/tmp/.download_in_progress"

func NewService() *Service {
	// Clear sentinel
	// If we are starting from scratch, we need to remove the sentinel file as any downloads at this point are done or broken
	_ = os.Remove(sentinelPath)
	return &Service{}
}

func (s *Service) ImageEnabled(c *gin.Context) {
	var rsp proto.Response

	// Check if /data mount is RO/RW
	testFile := "/data/.testfile"
	file, err := os.Create(testFile)
	defer file.Close()
	defer os.Remove(testFile)
	if err != nil {
		if os.IsPermission(err) {
			rsp.OkRspWithData(c, &proto.ImageEnabledRsp{
				Enabled: false,
			})
			return
		}
		rsp.OkRspWithData(c, &proto.ImageEnabledRsp{
			Enabled: false,
		})
		return
	}

	rsp.OkRspWithData(c, &proto.ImageEnabledRsp{
		Enabled: true,
	})
}

func (s *Service) StatusImage(c *gin.Context) {
	var rsp proto.Response

	// Check if the sentinel file exists
	log.Debug("StatusImage")
	if _, err := os.Stat(sentinelPath); err == nil {
		content, err := os.ReadFile(sentinelPath)
		if err != nil {
			log.Error("Failed to read sentinel file")
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "in_progress",
				File:       "",
				Percentage: "",
			})
			return
		}
		splitted := strings.Split(string(content), ";")
		if len(splitted) == 1 {
			// No percentage, just the URL
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "in_progress",
				File:       splitted[0],
				Percentage: "",
			})
		} else {
			// Percentage is available
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "in_progress",
				File:       splitted[0],
				Percentage: splitted[1],
			})
		}

		return
	}
	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "idle",
		File:       "",
		Percentage: "",
	})
}

func (s *Service) DownloadImageFile(c *gin.Context) {
	var rsp proto.Response

	log.Debug("DownloadImage")

	// Set a sentinel file to mark that there is a download in progress
	// This is to prevent multiple downloads at the same time
	if _, err := os.Stat(sentinelPath); err == nil {
		log.Debug("Download in progress")
		rsp.ErrRsp(c, -1, "download in progress")
		return
	}

	// Create the sentinel file
	err := os.WriteFile(sentinelPath, []byte("start"), 0644)
	if err != nil {
		log.Error("Failed to create sentinel file")
		rsp.ErrRsp(c, -1, "failed to create sentinel file")
		return
	}

    // Multipart Reader direkt nutzen (keine FormFile!)
    reader, err := c.Request.MultipartReader()
    if err != nil {
		rsp.OkRspWithData(c, &proto.StatusImageRsp{
			Status:     "invalid multipart data",
			File:       "",
			Percentage: "",
		})
		defer os.Remove(sentinelPath)
        return
    }

	
	var lw *loggingWriter

    for {
        part, err := reader.NextPart()
        if err == io.EOF {
            break
        }
        if err != nil {
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "failed to read part",
				File:       "",
				Percentage: "",
			})
			defer os.Remove(sentinelPath)
            return
        }

        if part.FormName() != "file" {
            continue
        }

        filename := part.FileName()
        if filename == "" {
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "no filename",
				File:       "",
				Percentage: "",
			})
			defer os.Remove(sentinelPath)
            return
        }

		data, err := os.ReadFile(sentinelPath)
		if err != nil {
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "error",
				File:       "",
				Percentage: "",
			})
			defer os.Remove(sentinelPath)
			return
		}

        outPath := "/data/" + filename
        out, err := os.Create(outPath)
        if err != nil {
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "cannot create file",
				File:       "",
				Percentage: "",
			})
			defer os.Remove(sentinelPath)
            return
        }
        defer out.Close()

		if strings.Contains(string(data), "start") {
			err = os.WriteFile(sentinelPath, []byte(filename), 0644)
			if err != nil {
				log.Error("Failed to create sentinel file")
				rsp.ErrRsp(c, -1, "failed to create sentinel file")
				defer os.Remove(sentinelPath)
				return
			}
			
			lw = &loggingWriter{writer: out, totalSize: c.Request.ContentLength}
			lw.startTicker()
		} else {
			if !strings.Contains(string(data), filename) {
				rsp.OkRspWithData(c, &proto.StatusImageRsp{
					Status:     "error",
					File:       "",
					Percentage: "",
				})
				defer os.Remove(sentinelPath)
				return
			}
		}

        // Direkt streamen → kein RAM-Bedarf außer kleinem Buffer
        _, err = io.Copy(lw, part)
        if err != nil {
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "write failed",
				File:       "",
				Percentage: "",
			})
			defer os.Remove(sentinelPath)
            return
        }
    }
	lw.stopTicker()

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "idle",
		File:       "",
		Percentage: "",
	})
	
	
	defer os.Remove(sentinelPath)
    return
}

func (s *Service) DownloadImage(c *gin.Context) {
	var req proto.MountImageReq
	var rsp proto.Response

	log.Debug("DownloadImage")

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if req.File == "" {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	// Parse the URI to see if its valid http/s
	u, err := url.Parse(req.File)
	if err != nil || u.Scheme == "" || u.Host == "" {
		rsp.ErrRsp(c, -1, "invalid url")
		return
	}

	// Set a sentinel file to mark that there is a download in progress
	// This is to prevent multiple downloads at the same time
	if _, err := os.Stat(sentinelPath); err == nil {
		log.Debug("Download in progress")
		rsp.ErrRsp(c, -1, "download in progress")
		return
	}
	// Create the sentinel file
	err = os.WriteFile(sentinelPath, []byte(req.File), 0644)
	if err != nil {
		log.Error("Failed to create sentinel file")
		rsp.ErrRsp(c, -1, "failed to create sentinel file")
		return
	}

	// Check if it actually exists and fail if it doesn't
	resp, err := http.Head(req.File)
	if resp.StatusCode != http.StatusOK || err != nil {
		rsp.ErrRsp(c, resp.StatusCode, "failed when checking the url")
		log.Error("Failed to check the URL")
		defer os.Remove(sentinelPath)
		return
	}
	defer resp.Body.Close()

	// Download the image in a goroutine to not block the request
	go func() {
		defer os.Remove(sentinelPath)
		resp, err = http.Get(req.File)
		if err != nil {
			log.Error("Failed to download the file")
			rsp.ErrRsp(c, -1, "failed to download the file")
			return
		}
		defer resp.Body.Close()
		// Create the destination file
		destPath := filepath.Join("/data", filepath.Base(u.Path))
		out, err := os.Create(destPath)
		if err != nil {
			log.Error("Failed to create destination file")
			rsp.ErrRsp(c, -1, "failed to create destination file")
			return
		}
		defer out.Close()

		lw := &loggingWriter{writer: out, totalSize: resp.ContentLength}
		lw.startTicker()
		_, err = io.Copy(lw, resp.Body)
		if err != nil {
			log.Error("Failed to save the file")
			rsp.ErrRsp(c, -1, "failed to save the file")
			lw.stopTicker()
			return
		}
		lw.stopTicker()
	}()
	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "in_progress",
		File:       req.File,
		Percentage: "",
	})
}

type loggingWriter struct {
	writer    io.Writer
	total     int64
	totalSize int64
	ticker    *time.Ticker
	done      chan bool
}

func (lw *loggingWriter) startTicker() {
	lw.ticker = time.NewTicker(2500 * time.Millisecond)
	lw.done = make(chan bool)
	go func() {
		for {
			select {
			case <-lw.done:
				return
			case <-lw.ticker.C:
				lw.updateSentinel()
			}
		}
	}()
}

func (lw *loggingWriter) stopTicker() {
	lw.ticker.Stop()
	lw.done <- true
}

func (lw *loggingWriter) updateSentinel() {
	percentage := float64(lw.total) / float64(lw.totalSize) * 100
	content, err := os.ReadFile(sentinelPath)
	if err != nil {
		log.Error("Failed to read sentinel file")
		return
	}
	splitted := strings.Split(string(content), ";")
	if len(splitted) == 0 {
		return
	}
	err = os.WriteFile(sentinelPath, []byte(fmt.Sprintf("%s;%.2f%%", splitted[0], percentage)), 0644)
	if err != nil {
		log.Error("Failed to update sentinel file")
	}
}

func (lw *loggingWriter) Write(p []byte) (int, error) {
	n, err := lw.writer.Write(p)
	lw.total += int64(n)
	return n, err
}

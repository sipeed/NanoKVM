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
	"regexp"
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

func isISO9660(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()

	// ISO-9660 Magic "CD001" bei Offset 32769
	_, err = f.Seek(0x8001, io.SeekStart)
	if err != nil {
		return false, err
	}

	buf := make([]byte, 5)
	_, err = io.ReadFull(f, buf)
	if err != nil {
		return false, err
	}

	return string(buf) == "CD001", nil
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
		log.Error("invalid multipart data")
		rsp.ErrRsp(c, -1, "invalid multipart data")
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
			log.Error("failed to read part")
			rsp.ErrRsp(c, -1, "failed to read part")
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return
        }

        if part.FormName() != "file" {
            continue
        }

        filename := part.FileName()
        if filename == "" {
			log.Error("no filename")
			rsp.ErrRsp(c, -1, "no filename")
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return
        }

		filename = filepath.Base(filename)

		if filename != part.FileName() {
			log.Warn("path detected in filename")
			rsp.ErrRsp(c, -1, "invalid filename")
			defer os.Remove(sentinelPath)
			return
		}

		if strings.Contains(filename, "..") {
			log.Warn("path traversal attempt")
			rsp.ErrRsp(c, -1, "invalid filename")
			defer os.Remove(sentinelPath)
			return
		}

		if !strings.HasSuffix(strings.ToLower(filename), ".iso") {
			rsp.ErrRsp(c, -1, "only .iso files allowed")
			defer os.Remove(sentinelPath)
			return
		}

		valid := regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
		if !valid.MatchString(filename) {
			rsp.ErrRsp(c, -1, "invalid filename")
			defer os.Remove(sentinelPath)
			return
		}

		data, err := os.ReadFile(sentinelPath)
		if err != nil {
			log.Error("Read failed")
			rsp.ErrRsp(c, -1, "Read failed")
			lw.stopTicker()
			defer os.Remove(sentinelPath)
			return
		}

        outPath := "/data/" + filename
        out, err := os.Create(outPath)
        if err != nil {
			log.Error("cannot create file")
			rsp.ErrRsp(c, -1, "cannot create file")
			lw.stopTicker()
			defer os.Remove(sentinelPath)
            return
        }
        defer out.Close()

		if strings.Contains(string(data), "start") {
			err = os.WriteFile(sentinelPath, []byte(filename), 0644)
			if err != nil {
				log.Error("Failed to create sentinel file")
				rsp.ErrRsp(c, -1, "failed to create sentinel file")
				lw.stopTicker()
				defer os.Remove(outPath)
				defer os.Remove(sentinelPath)
				return
			}
			
			lw = &loggingWriter{writer: out, totalSize: c.Request.ContentLength}
			lw.startTicker()
		} else {
			if !strings.Contains(string(data), filename) {
				log.Error("failed")
				rsp.ErrRsp(c, -1, "failed")
				lw.stopTicker()
				defer os.Remove(outPath)
				defer os.Remove(sentinelPath)
				return
			}
		}

        // Direkt streamen → kein RAM-Bedarf außer kleinem Buffer
        _, err = io.Copy(lw, part)
        if err != nil {
			log.Error("write failed")
			rsp.ErrRsp(c, -1, "write failed")
			lw.stopTicker()
			defer os.Remove(outPath)
			defer os.Remove(sentinelPath)
            return
        }

		ok, err := isISO9660(outPath)
		if err != nil || !ok {
			rsp.ErrRsp(c, -1, "file is not a valid ISO image")
			lw.stopTicker()
			defer os.Remove(outPath)
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

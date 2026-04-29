package download

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type Service struct{}

func NewService() *Service {
	// Clear sentinel
	// If we are starting from scratch, we need to remove the sentinel file as any downloads at this point are done or broken
	utils.ClearProgressStatus()
	return &Service{}
}

func (s *Service) ImageEnabled(c *gin.Context) {
	var rsp proto.Response

	// Check if /data mount is RO/RW
	testFile := "/data/.testfile"
	file, err := os.Create(testFile)
	if err != nil {
		rsp.OkRspWithData(c, &proto.EnabledRsp{
			Enabled: false,
		})
		return
	}
	_ = file.Close()
	_ = os.Remove(testFile)

	rsp.OkRspWithData(c, &proto.EnabledRsp{
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
	if utils.ProgressStatusExists() {
		content, err := utils.ReadProgressStatus()
		if err != nil {
			log.Error("Failed to read sentinel file")
			rsp.OkRspWithData(c, &proto.StatusImageRsp{
				Status:     "in_progress",
				File:       "",
				Percentage: "",
			})
			return
		}
		splitted := strings.SplitN(content, ";", 2)
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
	if utils.ProgressStatusExists() {
		log.Debug("Download in progress")
		rsp.ErrRsp(c, -1, "download in progress")
		return
	}

	// Create the sentinel file
	if err := utils.WriteProgressStatus("start"); err != nil {
		log.Error("Failed to create sentinel file")
		rsp.ErrRsp(c, -1, "failed to create sentinel file")
		return
	}
	defer utils.ClearProgressStatus()

	reader, err := c.Request.MultipartReader()
	if err != nil {
		log.Error("invalid multipart data")
		rsp.ErrRsp(c, -1, "invalid multipart data")
		return
	}

	uploaded := false
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Error("failed to read part")
			rsp.ErrRsp(c, -1, "failed to read part")
			return
		}

		if part.FormName() != "file" {
			continue
		}
		uploaded = true

		filename := part.FileName()
		if filename == "" {
			log.Error("no filename")
			rsp.ErrRsp(c, -1, "no filename")
			return
		}

		if err := utils.ValidateFlatFilename(filename); err != nil {
			rsp.ErrRsp(c, -1, "invalid filename")
			return
		}

		if !strings.HasSuffix(strings.ToLower(filename), ".iso") {
			rsp.ErrRsp(c, -1, "only .iso files allowed")
			return
		}

		if err := utils.WriteProgressStatus(filename); err != nil {
			log.Error("Failed to create sentinel file")
			rsp.ErrRsp(c, -1, "failed to create sentinel file")
			return
		}

		outPath := filepath.Join("/data", filename)
		out, err := os.Create(outPath)
		if err != nil {
			log.Error("cannot create file")
			rsp.ErrRsp(c, -1, "cannot create file")
			return
		}

		pw := utils.NewProgressWriter(out, c.Request.ContentLength, utils.ProgressStatusPath)
		_, err = io.Copy(pw, part)
		pw.Stop()
		if closeErr := out.Close(); closeErr != nil && err == nil {
			err = closeErr
		}
		if err != nil {
			log.Error("write failed")
			rsp.ErrRsp(c, -1, "write failed")
			_ = os.Remove(outPath)
			return
		}

		ok, err := isISO9660(outPath)
		if err != nil || !ok {
			rsp.ErrRsp(c, -1, "file is not a valid ISO image")
			_ = os.Remove(outPath)
			return
		}
	}
	if !uploaded {
		rsp.ErrRsp(c, -1, "no file uploaded")
		return
	}

	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "idle",
		File:       "",
		Percentage: "",
	})
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
	if utils.ProgressStatusExists() {
		log.Debug("Download in progress")
		rsp.ErrRsp(c, -1, "download in progress")
		return
	}
	// Create the sentinel file
	if err := utils.WriteProgressStatus(req.File); err != nil {
		log.Error("Failed to create sentinel file")
		rsp.ErrRsp(c, -1, "failed to create sentinel file")
		return
	}

	// Check if it actually exists and fail if it doesn't
	resp, err := http.Head(req.File)
	if err != nil {
		log.Error("Failed to check the URL")
		rsp.ErrRsp(c, -1, "failed when checking the url")
		utils.ClearProgressStatus()
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		rsp.ErrRsp(c, resp.StatusCode, "failed when checking the url")
		log.Error("Failed to check the URL")
		utils.ClearProgressStatus()
		return
	}

	// Download the image in a goroutine to not block the request
	go func() {
		defer utils.ClearProgressStatus()
		resp, err := http.Get(req.File)
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

		pw := utils.NewProgressWriter(out, resp.ContentLength, utils.ProgressStatusPath)
		defer pw.Stop()

		_, err = io.Copy(pw, resp.Body)
		if err != nil {
			log.Error("Failed to save the file")
			rsp.ErrRsp(c, -1, "failed to save the file")
			return
		}
	}()
	rsp.OkRspWithData(c, &proto.StatusImageRsp{
		Status:     "in_progress",
		File:       req.File,
		Percentage: "",
	})
}

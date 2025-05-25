package storage

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

const (
	imageDirectory = "/data"
	cdromFlag      = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/cdrom"
	mountDevice    = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/file"
	roFlag         = "/sys/kernel/config/usb_gadget/g0/functions/mass_storage.disk0/lun.0/ro"
)

func (s *Service) GetImages(c *gin.Context) {
	var rsp proto.Response
	var images []string

	err := filepath.Walk(imageDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			name := strings.ToLower(info.Name())
			if strings.HasSuffix(name, ".iso") || strings.HasSuffix(name, ".img") {
				images = append(images, path)
			}
		}

		return nil
	})
	if err != nil {
		rsp.ErrRsp(c, -2, "get images failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetImagesRsp{
		Files: images,
	})
	log.Debugf("get images success, total %d", len(images))
}

func (s *Service) MountImage(c *gin.Context) {
	var req proto.MountImageReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	// cdrom and ro flag
	// set to 0 when unmount image
	// set to 1 when mount image and the CD-ROM is enabled
	if req.File == "" || req.Cdrom {
		flag := "0"
		if req.File != "" && req.Cdrom {
			flag = "1"
		}

		// unmount
		if err := os.WriteFile(mountDevice, []byte("\n"), 0o666); err != nil {
			log.Errorf("unmount file failed: %s", err)
			rsp.ErrRsp(c, -2, "unmount image failed")
			return
		}

		// ro flag
		if err := os.WriteFile(roFlag, []byte(flag), 0o666); err != nil {
			log.Errorf("set ro flag failed: %s", err)
			rsp.ErrRsp(c, -2, "set ro flag failed")
			return
		}

		// cdrom flag
		if err := os.WriteFile(cdromFlag, []byte(flag), 0o666); err != nil {
			log.Errorf("set cdrom flag failed: %s", err)
			rsp.ErrRsp(c, -2, "set cdrom flag failed")
			return
		}
	}

	// mount if file provided
	image := req.File
	if image != "" {
		if err := os.WriteFile(mountDevice, []byte(image), 0o666); err != nil {
			log.Errorf("mount file %s failed: %s", image, err)
			rsp.ErrRsp(c, -2, "mount image failed")
			return
		}
	}

	rsp.OkRsp(c)
	log.Debugf("mount image %s success", req.File)
}

func (s *Service) GetMountedImage(c *gin.Context) {
	var rsp proto.Response

	content, err := os.ReadFile(mountDevice)
	if err != nil {
		rsp.ErrRsp(c, -2, "read failed")
		return
	}

	image := strings.ReplaceAll(string(content), "\n", "")

	data := &proto.GetMountedImageRsp{
		File: image,
	}

	rsp.OkRspWithData(c, data)
}

func (s *Service) GetCdRom(c *gin.Context) {
	var rsp proto.Response

	content, err := os.ReadFile(cdromFlag)
	if err != nil {
		rsp.ErrRsp(c, -1, "read failed")
		return
	}

	flag := strings.ReplaceAll(string(content), "\n", "")
	flatInt, err := strconv.ParseInt(flag, 10, 64)
	if err != nil {
		rsp.ErrRsp(c, -2, "parse failed")
		return
	}

	data := &proto.GetCdRomRsp{
		Cdrom: flatInt,
	}

	rsp.OkRspWithData(c, data)
}

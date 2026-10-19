package storage

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/utils"
)

// The handlers in this file are the pre-2.6 image API. The web UI uses the
// media API instead, but these routes stay so scripts written against the
// documented endpoints keep working: same paths, same request shapes, same
// responses. They share the media implementation underneath, which is also
// where the guards they used to lack now live.

func (s *Service) GetImages(c *gin.Context) {
	var rsp proto.Response

	media, err := listMedia()
	if err != nil {
		respondError(c, err)
		return
	}

	files := make([]string, 0, len(media))
	for _, item := range media {
		if item.Type == proto.MediaTypeImage {
			files = append(files, filepath.Join(mediaDirectory, filepath.FromSlash(item.Rel)))
		}
	}

	rsp.OkRspWithData(c, &proto.GetImagesRsp{Files: files})
	log.Debugf("get images success, total %d", len(files))
}

func (s *Service) MountImage(c *gin.Context) {
	var req proto.MountImageReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}

	// An empty file keeps its original meaning: attach the whole data
	// partition, which is what the emulated disk exposes by default.
	backing := partitionDevice
	if req.File != "" {
		rel, err := legacyImageRel(req.File)
		if err != nil {
			respondError(c, err)
			return
		}

		backing, err = utils.ResolveMediaID(rel)
		if err != nil {
			respondError(c, err)
			return
		}
	}

	if req.Cdrom {
		kind, err := diskfs.Detect(backing)
		if err != nil || !kind.Optical() {
			respondError(c, fmt.Errorf("%w: %s", errNotOptical, req.File))
			return
		}
	}

	// An image is always served read-only, the raw partition is not.
	ro := req.Cdrom || req.File != ""

	if err := s.attachMedium(backing, req.Cdrom, ro, false); err != nil {
		respondError(c, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("mount image %s success", req.File)
}

func (s *Service) GetMountedImage(c *gin.Context) {
	var rsp proto.Response

	status, err := readDiskStatus()
	if err != nil {
		rsp.ErrRsp(c, codeOperationFailed, "read failed")
		return
	}

	// The data partition is reported as "nothing mounted", the way this
	// endpoint has always answered.
	file := ""
	if status.State == diskStateImage {
		file = status.Backing
	}

	rsp.OkRspWithData(c, &proto.GetMountedImageRsp{File: file})
}

func (s *Service) GetCdRom(c *gin.Context) {
	var rsp proto.Response

	cdrom, err := readLunBool(lunCDRomFlag)
	if err != nil {
		rsp.ErrRsp(c, codeOperationFailed, "read failed")
		return
	}

	flag := int64(0)
	if cdrom {
		flag = 1
	}

	rsp.OkRspWithData(c, &proto.GetCdRomRsp{Cdrom: flag})
}

func (s *Service) DeleteImage(c *gin.Context) {
	var req proto.DeleteImageReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, codeInvalidArgument, "invalid arguments")
		return
	}

	rel, err := legacyImageRel(req.File)
	if err != nil {
		respondError(c, err)
		return
	}

	target, err := utils.ResolveMediaID(rel)
	if err != nil {
		respondError(c, err)
		return
	}

	if err := deleteMedium(target); err != nil {
		log.Errorf("failed to remove file %s: %s", target, err)
		respondError(c, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete image %s success", req.File)
}

// legacyImageRel turns the absolute path this API has always used into a
// medium id. The old validation was a string prefix check, which also accepted
// "/dataevil.img" and "/data/../../etc/passwd.iso"; resolving the path
// properly closes both.
func legacyImageRel(file string) (string, error) {
	if !filepath.IsAbs(file) {
		return "", fmt.Errorf("%w: %s is not an absolute path", utils.ErrInvalidMediaID, file)
	}

	rel, err := filepath.Rel(mediaDirectory, filepath.Clean(file))
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("%w: %s is outside %s", utils.ErrInvalidMediaID, file, mediaDirectory)
	}

	return rel, nil
}

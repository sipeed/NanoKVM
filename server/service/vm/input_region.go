package vm

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
)

var (
	inputRegionFile = "/etc/kvm/input-region.json"
	inputRegionMu   sync.RWMutex
)

func (s *Service) GetInputResolution(c *gin.Context) {
	var rsp proto.Response
	width, widthErr := readPositiveInt("/kvmapp/kvm/width")
	height, heightErr := readPositiveInt("/kvmapp/kvm/height")
	if widthErr != nil || heightErr != nil {
		rsp.ErrRsp(c, -1, "failed to read input resolution")
		return
	}
	rsp.OkRspWithData(c, &proto.GetInputResolutionRsp{Width: width, Height: height})
}

func readPositiveInt(path string) (int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	value, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil || value <= 0 {
		return 0, errors.New("invalid positive integer")
	}
	return value, nil
}

func (s *Service) GetInputRegion(c *gin.Context) {
	var rsp proto.Response

	inputRegionMu.RLock()
	region, err := readInputRegion(inputRegionFile)
	inputRegionMu.RUnlock()
	if errors.Is(err, os.ErrNotExist) {
		rsp.OkRspWithData(c, &proto.GetInputRegionRsp{InputRegion: proto.InputRegion{Mode: "off"}})
		return
	}
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to read input region")
		return
	}
	if region == nil {
		rsp.OkRspWithData(c, &proto.GetInputRegionRsp{InputRegion: proto.InputRegion{Mode: "off"}})
		return
	}

	rsp.OkRspWithData(c, &proto.GetInputRegionRsp{InputRegion: *region})
}

func (s *Service) SetInputRegion(c *gin.Context) {
	var req proto.SetInputRegionReq
	var rsp proto.Response

	if err := c.ShouldBindJSON(&req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	inputRegionMu.Lock()
	defer inputRegionMu.Unlock()

	if req.Mode == "off" || req.Mode == "auto" ||
		(req.Mode == "manual" && req.FrameWidth == nil && req.FrameHeight == nil &&
			req.Left == nil && req.Top == nil && req.Width == nil && req.Height == nil) {
		region, err := readInputRegion(inputRegionFile)
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			rsp.ErrRsp(c, -2, "failed to read input region")
			return
		}
		if region == nil {
			region = &proto.InputRegion{}
		}
		region.Mode = req.Mode
		if req.Resolutions != nil {
			if err := validateOriginalResolutions(*req.Resolutions); err != nil {
				rsp.ErrRsp(c, -1, "invalid original resolutions")
				return
			}
			region.Resolutions = *req.Resolutions
		}
		if req.SelectedResolution != nil {
			region.SelectedResolution = *req.SelectedResolution
		}
		if err := validateSelectedResolution(region.SelectedResolution, region.Resolutions); err != nil {
			rsp.ErrRsp(c, -1, "invalid selected resolution")
			return
		}
		if err := writeInputRegion(inputRegionFile, *region); err != nil {
			rsp.ErrRsp(c, -2, "failed to save input region mode")
			return
		}
		rsp.OkRsp(c)
		return
	}
	if req.Mode != "manual" {
		rsp.ErrRsp(c, -1, "invalid input region mode")
		return
	}
	region, err := inputRegionFromRequest(req)
	if err != nil {
		rsp.ErrRsp(c, -1, "invalid input region")
		return
	}
	previous, readErr := readInputRegion(inputRegionFile)
	if readErr != nil && !errors.Is(readErr, os.ErrNotExist) {
		rsp.ErrRsp(c, -2, "failed to read input region")
		return
	}
	if previous != nil {
		region.Resolutions = previous.Resolutions
		region.SelectedResolution = previous.SelectedResolution
	}
	if req.Resolutions != nil {
		if err := validateOriginalResolutions(*req.Resolutions); err != nil {
			rsp.ErrRsp(c, -1, "invalid original resolutions")
			return
		}
		region.Resolutions = *req.Resolutions
	}
	if req.SelectedResolution != nil {
		region.SelectedResolution = *req.SelectedResolution
	}
	if err := validateSelectedResolution(region.SelectedResolution, region.Resolutions); err != nil {
		rsp.ErrRsp(c, -1, "invalid selected resolution")
		return
	}
	if err := writeInputRegion(inputRegionFile, region); err != nil {
		rsp.ErrRsp(c, -2, "failed to save input region")
		return
	}

	rsp.OkRsp(c)
}

func validateOriginalResolutions(resolutions []proto.OriginalResolution) error {
	seen := make(map[proto.OriginalResolution]struct{}, len(resolutions))
	for _, resolution := range resolutions {
		if resolution.Width <= 0 || resolution.Height <= 0 {
			return errors.New("resolution dimensions must be positive")
		}
		if _, ok := seen[resolution]; ok {
			return errors.New("duplicate resolution")
		}
		seen[resolution] = struct{}{}
	}
	return nil
}

func validateSelectedResolution(selected string, resolutions []proto.OriginalResolution) error {
	if selected == "" {
		return nil
	}
	for _, resolution := range resolutions {
		if selected == resolutionKey(resolution) {
			return nil
		}
	}
	return errors.New("selected resolution not found")
}

func resolutionKey(resolution proto.OriginalResolution) string {
	return fmt.Sprintf("%dx%d", resolution.Width, resolution.Height)
}

func inputRegionFromRequest(req proto.SetInputRegionReq) (proto.InputRegion, error) {
	if req.FrameWidth == nil || req.FrameHeight == nil || req.Left == nil ||
		req.Top == nil || req.Width == nil || req.Height == nil {
		return proto.InputRegion{}, errors.New("input region must be complete")
	}

	region := proto.InputRegion{
		Mode:        "manual",
		FrameWidth:  *req.FrameWidth,
		FrameHeight: *req.FrameHeight,
		Left:        *req.Left,
		Top:         *req.Top,
		Width:       *req.Width,
		Height:      *req.Height,
	}
	return region, validateInputRegion(region)
}

func validateInputRegion(region proto.InputRegion) error {
	if region.Mode == "off" || region.Mode == "auto" {
		return nil
	}
	if region.Mode == "manual" && region.FrameWidth == 0 && region.FrameHeight == 0 {
		return nil
	}
	if region.Mode != "manual" {
		return errors.New("invalid input region mode")
	}
	if region.FrameWidth <= 0 || region.FrameHeight <= 0 {
		return errors.New("frame dimensions must be positive")
	}
	if region.Left < 0 || region.Top < 0 || region.Width <= 0 || region.Height <= 0 {
		return errors.New("region dimensions must be positive and offsets non-negative")
	}
	if region.Left > region.FrameWidth-region.Width || region.Top > region.FrameHeight-region.Height {
		return errors.New("region must be inside frame")
	}
	return nil
}

func readInputRegion(path string) (*proto.InputRegion, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var region *proto.InputRegion
	if err := json.Unmarshal(data, &region); err != nil {
		return nil, nil
	}
	if region == nil {
		return nil, nil
	}
	if region.Mode == "" {
		region.Mode = "manual"
	}
	if err := validateInputRegion(*region); err != nil {
		return nil, nil
	}
	return region, nil
}

func writeInputRegion(path string, region proto.InputRegion) error {
	data, err := json.Marshal(region)
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	tmp, err := os.CreateTemp(dir, ".input-region-*.tmp")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)

	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Chmod(0o644); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpPath, path)
}

func removeInputRegion(path string) error {
	err := os.Remove(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

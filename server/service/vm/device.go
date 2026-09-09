package vm

import (
	"os"
	"strings"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	DeviceVendorFile = "/etc/kvm/device-vendor"
	DeviceSerialFile = "/etc/kvm/device-serial"
)

func (s *Service) GetDeviceVendor(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(DeviceVendorFile)
	if err != nil {
		rsp.ErrRsp(c, -1, "read device vendor failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetDeviceVendorRsp{
		Vendor: strings.Replace(string(data), "\n", "", -1),
	})
	log.Debugf("get device vendor successful")
}

func (s *Service) SetDeviceVendor(c *gin.Context) {
	var req proto.SetDeviceVendorReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if err := os.WriteFile(DeviceVendorFile, []byte(req.Vendor), 0o644); err != nil {
		rsp.ErrRsp(c, -2, "write failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set device vendor: %s", req.Vendor)
}

func (s *Service) GetDeviceSerial(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(DeviceSerialFile)
	if err != nil {
		rsp.ErrRsp(c, -1, "read device serial failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetDeviceSerialRsp{
		Serial: strings.Replace(string(data), "\n", "", -1),
	})
	log.Debugf("get device serial successful")
}

func (s *Service) SetDeviceSerial(c *gin.Context) {
	var req proto.SetDeviceSerialReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if err := os.WriteFile(DeviceSerialFile, []byte(req.Serial), 0o644); err != nil {
		rsp.ErrRsp(c, -2, "write failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set device serial: %s", req.Serial)
}

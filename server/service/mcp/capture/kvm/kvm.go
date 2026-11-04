package kvmcapture

import (
	"NanoKVM-Server/common"
	mcpservice "NanoKVM-Server/service/mcp"
	"NanoKVM-Server/service/mcp/capture"
	"NanoKVM-Server/service/vm"
)

func New() mcpservice.Snapshotter {
	return mcpcapture.NewWithCaptureLease(common.GetKvmVision(), common.InputSize, vm.AcquireHdmiCaptureLeaseForRead)
}

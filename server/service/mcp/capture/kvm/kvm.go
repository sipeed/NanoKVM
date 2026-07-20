package kvmcapture

import (
	"NanoKVM-Server/common"
	mcpservice "NanoKVM-Server/service/mcp"
	"NanoKVM-Server/service/mcp/capture"
)

func New() mcpservice.Snapshotter {
	return mcpcapture.New(common.GetKvmVision(), func() (uint16, uint16) {
		screen := common.GetScreen()
		common.CheckScreen()
		return screen.Width, screen.Height
	})
}

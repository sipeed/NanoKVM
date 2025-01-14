package proto

type WakeOnLANReq struct {
	Mac string `form:"mac" validate:"required"`
}

type GetMacRsp struct {
	Macs []string `json:"macs"`
}

type DeleteMacReq struct {
	Mac string `form:"mac" validate:"required"`
}

type TailscaleState string

const (
	TailscaleNotInstall TailscaleState = "notInstall"
	TailscaleNotRunning TailscaleState = "notRunning"
	TailscaleNotLogin   TailscaleState = "notLogin"
	TailscaleStopped    TailscaleState = "stopped"
	TailscaleRunning    TailscaleState = "running"
)

type GetTailscaleStatusRsp struct {
	State   TailscaleState `json:"state"`
	Name    string         `json:"name"`
	IP      string         `json:"ip"`
	Account string         `json:"account"`
}

type LoginTailscaleRsp struct {
	Url string `json:"url"`
}

type GetWifiRsp struct {
	Supported bool `json:"supported"`
	Connected bool `json:"connected"`
}

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

type GetTailscaleStatusRsp struct {
	Status  string `json:"status"` // notInstall | notLogin | stopped | running
	Name    string `json:"name"`
	IP      string `json:"ip"`
	Account string `json:"account"`
}

type UpdateTailscaleStatusReq struct {
	Command string // up | down
}

type UpdateTailscaleStatusRsp struct {
	Status string `json:"status"` // stopped | running
}

type LoginTailscaleRsp struct {
	Status string `json:"status"`
	Url    string `json:"url"`
}

type GetWifiRsp struct {
	Supported bool `json:"supported"`
	Connected bool `json:"connected"`
}

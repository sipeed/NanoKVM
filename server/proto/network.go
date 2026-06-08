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

type SetMacNameReq struct {
	Mac  string `form:"mac" validate:"required"`
	Name string `form:"name" validate:"required"`
}

type GetWifiRsp struct {
	Supported bool   `json:"supported"`
	ApMode    bool   `json:"apMode"`
	Connected bool   `json:"connected"`
	Ssid      string `json:"ssid"`
}

type ConnectWifiReq struct {
	Ssid     string `validate:"required"`
	Password string `validate:"required"`
}

type GetDNSRsp struct {
	Mode      string   `json:"mode"`
	Servers   []string `json:"servers"`
	Effective []string `json:"effective"`
	DHCP      []string `json:"dhcp"`
	Info      DNSInfo  `json:"info"`
}

type SetDNSReq struct {
	Mode    string   `json:"mode" validate:"required,oneof=manual dhcp"`
	Servers []string `json:"servers"`
}

type DNSInfo struct {
	Interface     string   `json:"interface"`
	Type          string   `json:"type"`
	Address       string   `json:"address"`
	SubnetMask    string   `json:"subnetMask"`
	Gateway       string   `json:"gateway"`
	SearchDomains []string `json:"searchDomains"`
}

type GetIPv4Rsp struct {
	Mode       string  `json:"mode"`       // "dhcp" or "static"
	Address    string  `json:"address"`    // configured static address (without prefix), empty in dhcp mode
	SubnetMask string  `json:"subnetMask"` // configured static subnet mask, empty in dhcp mode
	Gateway    string  `json:"gateway"`    // configured static gateway, empty in dhcp mode
	Info       DNSInfo `json:"info"`       // currently effective network details
}

type SetIPv4Req struct {
	Mode       string `json:"mode" validate:"required,oneof=static dhcp"`
	Address    string `json:"address"`
	SubnetMask string `json:"subnetMask"`
	Gateway    string `json:"gateway"`
}

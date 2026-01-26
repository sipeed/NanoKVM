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
	Password string `valid:"required"`
}

// Ethernet configuration
type EthernetConfig struct {
	DHCP    bool   `json:"dhcp"`
	IP      string `json:"ip"`
	Netmask string `json:"netmask"` // 点分十进制格式：255.255.255.0
	Gateway string `json:"gateway"`
	DNS1    string `json:"dns1"`
	DNS2    string `json:"dns2"`
}

type GetEthernetConfigRsp struct {
	Config  EthernetConfig `json:"config"`
	Current EthernetConfig `json:"current"` // 当前实际生效的配置
}

type SetEthernetConfigReq struct {
	DHCP    bool   `form:"dhcp"`
	IP      string `form:"ip"`
	Netmask string `form:"netmask"`
	Gateway string `form:"gateway"`
	DNS1    string `form:"dns1"`
	DNS2    string `form:"dns2"`
}

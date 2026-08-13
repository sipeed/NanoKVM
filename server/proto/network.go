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
	Supported           bool   `json:"supported"`
	ApMode              bool   `json:"apMode"`
	Connected           bool   `json:"connected"`
	Ssid                string `json:"ssid"`
	Mode                string `json:"mode"`
	IPMode              string `json:"ipMode"`
	Address             string `json:"address"`
	SubnetMask          string `json:"subnetMask"`
	Gateway             string `json:"gateway"`
	PasswordSet         bool   `json:"passwordSet"`
	Identity            string `json:"identity"`
	EAP                 string `json:"eap"`
	Phase2              string `json:"phase2"`
	AnonymousIdentity   string `json:"anonymousIdentity"`
	CACert              string `json:"caCert"`
	ClientCert          string `json:"clientCert"`
	PrivateKey          string `json:"privateKey"`
	PrivateKeyPasswdSet bool   `json:"privateKeyPasswdSet"`
	DomainSuffixMatch   string `json:"domainSuffixMatch"`
}

type ConnectWifiReq struct {
	Ssid              string `json:"ssid" form:"ssid"`
	Password          string `json:"password" form:"password"`
	IPMode            string `json:"ipMode" form:"ipMode"`
	Address           string `json:"address" form:"address"`
	SubnetMask        string `json:"subnetMask" form:"subnetMask"`
	Gateway           string `json:"gateway" form:"gateway"`
	Mode              string `json:"mode" form:"mode"`
	Identity          string `json:"identity" form:"identity"`
	EAP               string `json:"eap" form:"eap"`
	Phase2            string `json:"phase2" form:"phase2"`
	AnonymousIdentity string `json:"anonymousIdentity" form:"anonymousIdentity"`
	CACert            string `json:"caCert" form:"caCert"`
	ClientCert        string `json:"clientCert" form:"clientCert"`
	PrivateKey        string `json:"privateKey" form:"privateKey"`
	PrivateKeyPasswd  string `json:"privateKeyPasswd" form:"privateKeyPasswd"`
	DomainSuffixMatch string `json:"domainSuffixMatch" form:"domainSuffixMatch"`
}

type GetEthernetRsp struct {
	Supported           bool   `json:"supported"`
	Mode                string `json:"mode"`
	Configured          bool   `json:"configured"`
	Connected           bool   `json:"connected"`
	Interface           string `json:"interface"`
	IPMode              string `json:"ipMode"`
	Address             string `json:"address"`
	SubnetMask          string `json:"subnetMask"`
	Gateway             string `json:"gateway"`
	PasswordSet         bool   `json:"passwordSet"`
	Identity            string `json:"identity"`
	EAP                 string `json:"eap"`
	Phase2              string `json:"phase2"`
	AnonymousIdentity   string `json:"anonymousIdentity"`
	CACert              string `json:"caCert"`
	ClientCert          string `json:"clientCert"`
	PrivateKey          string `json:"privateKey"`
	PrivateKeyPasswdSet bool   `json:"privateKeyPasswdSet"`
	DomainSuffixMatch   string `json:"domainSuffixMatch"`
}

type SetEthernetReq struct {
	Mode              string `json:"mode" form:"mode"`
	IPMode            string `json:"ipMode" form:"ipMode"`
	Address           string `json:"address" form:"address"`
	SubnetMask        string `json:"subnetMask" form:"subnetMask"`
	Gateway           string `json:"gateway" form:"gateway"`
	Password          string `json:"password" form:"password"`
	Identity          string `json:"identity" form:"identity"`
	EAP               string `json:"eap" form:"eap"`
	Phase2            string `json:"phase2" form:"phase2"`
	AnonymousIdentity string `json:"anonymousIdentity" form:"anonymousIdentity"`
	CACert            string `json:"caCert" form:"caCert"`
	ClientCert        string `json:"clientCert" form:"clientCert"`
	PrivateKey        string `json:"privateKey" form:"privateKey"`
	PrivateKeyPasswd  string `json:"privateKeyPasswd" form:"privateKeyPasswd"`
	DomainSuffixMatch string `json:"domainSuffixMatch" form:"domainSuffixMatch"`
}

type GetDNSRsp struct {
	Mode      string   `json:"mode"`
	Servers   []string `json:"servers"`
	Effective []string `json:"effective"`
	DHCP      []string `json:"dhcp"`
	Info      DNSInfo  `json:"info"`
	Infos     []DNSInfo `json:"infos"`
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
	Signal        string   `json:"signal"`
	RxRate        string   `json:"rxRate"`
	TxRate        string   `json:"txRate"`
	SearchDomains []string `json:"searchDomains"`
}

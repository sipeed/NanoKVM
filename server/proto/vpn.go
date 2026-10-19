package proto

type GetVPNPreferenceRsp struct {
	VPN string `json:"vpn"` // "tailscale" or "netbird"
}

type SetVPNPreferenceReq struct {
	VPN string `json:"vpn" form:"vpn" validate:"required"`
}

package proto

type GetBiosModeRsp struct {
	Mode string `json:"mode"` // normal or bios
}

type SetBiosModeReq struct {
	Mode string `validate:"required"` // normal or bios
}

type GetHidModeRsp struct {
	Mode string `json:"mode"` // normal or hid-only
}

type SetHidModeReq struct {
	Mode string `validate:"required"` // normal or hid-only
}

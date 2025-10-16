package proto

type GetBiosModeRsp struct {
	Mode string `json:"mode"` // normal or bios
}

type SetBiosModeReq struct {
	Mode string `validate:"required"` // normal or bios
}

type GetWoWModeRsp struct {
	Mode string `json:"mode"` // no-wow or wow
}

type SetWoWModeReq struct {
	Mode string `validate:"required"` // no-wow or wow
}

type GetHidModeRsp struct {
	Mode string `json:"mode"` // normal or hid-only
}

type SetHidModeReq struct {
	Mode string `validate:"required"` // normal or hid-only
}

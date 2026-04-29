package proto

type MountImageReq struct {
	File  string `json:"file" validate:"omitempty"`
	Cdrom bool   `json:"cdrom" validate:"omitempty"`
}

type GetCdRomRsp struct {
	Cdrom int64 `json:"cdrom"`
}

type DeleteImageReq struct {
	File string `json:"file" validate:"required"`
}

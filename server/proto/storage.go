package proto

type GetImagesRsp struct {
	Files []string `json:"files"`
}

type MountImageReq struct {
	File  string `json:"file" validate:"omitempty"`
	Cdrom bool   `json:"cdrom" validate:"omitempty"`
}

type GetMountedImageRsp struct {
	File string `json:"file"`
}

type GetCdRomRsp struct {
	Cdrom int64 `json:"cdrom"`
}

type DeleteImageReq struct {
	File string `json:"file" validate:"required"`
}

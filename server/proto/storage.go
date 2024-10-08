package proto

type GetImagesRsp struct {
	Files []string `json:"files"`
}

type MountImageReq struct {
	File string `json:"file" validate:"omitempty"`
}

type GetMountedImageRsp struct {
	File string `json:"file"`
}

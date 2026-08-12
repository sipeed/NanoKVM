package proto

type DownloadImageReq struct {
	File      string `json:"file" validate:"required"`
	SHA256Sum string `json:"sha256sum"`
}

type ImageEnabledRsp struct {
	Enabled bool `json:"enabled"`
}

type StatusImageRsp struct {
	Status     string `json:"status"`
	File       string `json:"file"`
	Percentage string `json:"percentage"`
}

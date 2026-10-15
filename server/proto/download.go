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
	Loaded     int64  `json:"loaded"` // bytes transferred so far
	Total      int64  `json:"total"`  // expected bytes, 0 when unknown
}

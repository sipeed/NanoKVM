package proto

type ImageEnabledRsp struct {
	Enabled bool `json:"enabled"`
}

type StatusImageRsp struct {
	Status     string `json:"status"`
	File       string `json:"file"`
	Percentage string `json:"percentage"`
}

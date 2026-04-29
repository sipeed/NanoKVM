package proto

type StatusImageRsp struct {
	Status     string `json:"status"`
	File       string `json:"file"`
	Percentage string `json:"percentage"`
}

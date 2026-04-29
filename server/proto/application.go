package proto

type GetVersionRsp struct {
	Current string `json:"current"`
	Latest  string `json:"latest"`
}

type SetPreviewReq struct {
	Enable bool `validate:"omitempty"`
}

package proto

type GetVersionRsp struct {
	Current string `json:"current"`
	Latest  string `json:"latest"`
}

type GetPreviewRsp struct {
	Enabled bool `json:"enabled"`
}

type SetPreviewReq struct {
	Enable bool `validate:"omitempty"`
}

type GetUpdateServerRsp struct {
	Enabled bool   `json:"enabled"`
	URL     string `json:"url"`
}

type SetUpdateServerReq struct {
	Enabled *bool  `json:"enabled" form:"enabled" validate:"required"`
	URL     string `json:"url" form:"url"`
}

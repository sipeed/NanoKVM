package proto

type GetMCPConfigRsp struct {
	Enabled       bool   `json:"enabled"`
	APIKey        string `json:"apiKey"`
	ControlMode   string `json:"controlMode"`
	Transitioning bool   `json:"transitioning"`
}

type SetMCPConfigReq struct {
	Enabled *bool `json:"enabled" form:"enabled" validate:"required"`
}

package proto

type UpdateFrameDetectReq struct {
	Enabled bool `validate:"omitempty"`
}

type StopFrameDetectReq struct {
	Duration int `validate:"omitempty"`
}

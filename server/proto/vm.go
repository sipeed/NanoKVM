package proto

type GetInfoRsp struct {
	Ip          string `json:"ip"`
	Mdns        string `json:"mdns"`
	Image       string `json:"image"`
	Application string `json:"application"`
	Hardware    string `json:"hardware"`
	DeviceKey   string `json:"deviceKey"`
}

type SetGpioReq struct {
	Type     string `validate:"required"`  // reset / power
	Duration uint   `validate:"omitempty"` // press time (unit: milliseconds)
}

type GetGpioRsp struct {
	PWR bool `json:"pwr"` // power led
	HDD bool `json:"hdd"` // hdd led
}

type SetScreenReq struct {
	Type  string `validate:"required"` // resolution / fps / quality
	Value int    `validate:"number"`   // value
}

type GetScriptsRsp struct {
	Files []string `json:"files"`
}

type UploadScriptRsp struct {
	File string `json:"file"`
}

type RunScriptReq struct {
	Name string `validate:"required"`
	Type string `validate:"required"` // foreground | background
}

type RunScriptRsp struct {
	Log string `json:"log"`
}

type DeleteScriptReq struct {
	Name string `validate:"required"`
}

type GetVirtualDeviceRsp struct {
	Network bool `json:"network"`
	Disk    bool `json:"disk"`
}

type UpdateVirtualDeviceReq struct {
	Device string `validate:"required"`
}

type UpdateVirtualDeviceRsp struct {
	On bool `json:"on"`
}

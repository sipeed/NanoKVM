package proto

type GetBiosModeRsp struct {
	Mode string `json:"mode"` // normal or bios
}

type SetBiosModeReq struct {
	Mode string `validate:"required"` // normal or bios
}

type GetWoWModeRsp struct {
	Mode string `json:"mode"` // no-wow or wow
}

type SetWoWModeReq struct {
	Mode string `validate:"required"` // no-wow or wow
}

type GetHidModeRsp struct {
	Mode string `json:"mode"` // normal or hid-only
}

type SetHidModeReq struct {
	Mode string `validate:"required"` // normal or hid-only
	Bios string `validate:"required"` // normal or bios
	Wow string `validate:"required"` // no-wow or wow
}

type ShortcutKey struct {
	Code  string `json:"code"`
	Label string `json:"label"`
}

type Shortcut struct {
	ID   string        `json:"id"`
	Keys []ShortcutKey `json:"keys"`
}

type GetShortcutsRsp struct {
	Shortcuts []Shortcut `json:"shortcuts"`
}

type AddShortcutReq struct {
	Keys []ShortcutKey `validate:"required"`
}

type DeleteShortcutReq struct {
	ID string `validate:"required"`
}

type SetLeaderKeyReq struct {
	Key string `validate:"omitempty"`
}

type GetLeaderKeyRsp struct {
	Key string `json:"key"`
}

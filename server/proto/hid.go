package proto

type GetHidModeRsp struct {
	Mode string `json:"mode"` // normal or hid-only
}

type GetKeyboardLedStatusRsp struct {
	NumLock    bool   `json:"numLock"`
	CapsLock   bool   `json:"capsLock"`
	ScrollLock bool   `json:"scrollLock"`
	Known      bool   `json:"known"`
	UpdatedAt  string `json:"updatedAt"`
}

type SetHidModeReq struct {
	Mode string `validate:"required"` // normal or hid-only
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

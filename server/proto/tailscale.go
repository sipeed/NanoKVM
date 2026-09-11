package proto

type TailscaleState string

const (
	TailscaleNotInstall TailscaleState = "notInstall"
	TailscaleNotRunning TailscaleState = "notRunning"
	TailscaleNotLogin   TailscaleState = "notLogin"
	TailscaleStopped    TailscaleState = "stopped"
	TailscaleRunning    TailscaleState = "running"
)

type GetTailscaleStatusRsp struct {
	State   TailscaleState `json:"state"`
	Name    string         `json:"name"`
	IP      string         `json:"ip"`
	Account string         `json:"account"`
}

type LoginTailscaleRsp struct {
	Url string `json:"url"`
}

type GetTailscaleVersionRsp struct {
	Current string `json:"current"`
	Latest  string `json:"latest"`
}

type UpdateTailscaleRsp struct {
	Current    string `json:"current"`
	Updated    bool   `json:"updated"`
	Restarting bool   `json:"restarting"`
}

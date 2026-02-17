package proto

type NetbirdState string

const (
	NetbirdNotInstall NetbirdState = "notInstall"
	NetbirdNotRunning NetbirdState = "notRunning"
	NetbirdNotLogin   NetbirdState = "notLogin"
	NetbirdStopped    NetbirdState = "stopped"
	NetbirdRunning    NetbirdState = "running"
)

type GetNetbirdStatusRsp struct {
	State   NetbirdState `json:"state"`
	Name    string       `json:"name"`
	IP      string       `json:"ip"`
	Version string       `json:"version"`
}

type LoginNetbirdRsp struct {
	Url string `json:"url"`
}

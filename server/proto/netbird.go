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
	State         NetbirdState `json:"state"`
	Name          string       `json:"name"`
	IP            string       `json:"ip"`
	ManagementURL string       `json:"managementUrl"`
	Version       string       `json:"version"`
}

type UpNetbirdReq struct {
	SetupKey      string `json:"setupKey" form:"setupKey" validate:"required"`
	ManagementURL string `json:"managementUrl" form:"managementUrl" validate:"required"`
	AdminURL      string `json:"adminUrl" form:"adminUrl"`
}

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
	// PinnedVersion is the release this firmware ships, and UpdateAvailable
	// says it differs from the installed one. The installed client keeps
	// running in that case; the difference is shown, not enforced.
	//
	// InstalledVersion is the install marker. Version can carry the daemon's
	// own self-reported string instead, which is what a user wants to read but
	// not what UpdateAvailable compared, so the update notice uses this one.
	PinnedVersion    string `json:"pinnedVersion"`
	InstalledVersion string `json:"installedVersion"`
	UpdateAvailable  bool   `json:"updateAvailable"`
}

type LoginNetbirdRsp struct {
	Url string `json:"url"`
}

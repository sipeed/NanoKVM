package application

const (
	// Update-Channel: Schattenwelt/NanoKVM Fork (Multiuser).
	// Erwartete Assets im jeweiligen GitHub-Release:
	//   - latest.json
	//   - nanokvm_<version>.tar.gz
	// "latest"  = neuestes "Latest"-markiertes Release im Fork.
	// "preview" = Release mit Tag "preview" im Fork.
	StableURL  = "https://github.com/Schattenwelt/NanoKVM/releases/latest/download"
	PreviewURL = "https://github.com/Schattenwelt/NanoKVM/releases/download/preview"

	AppDir    = "/kvmapp"
	BackupDir = "/root/old"
	CacheDir  = "/root/.kvmcache"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

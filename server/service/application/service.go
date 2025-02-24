package application

const (
	BaseURL = "https://cdn.sipeed.com/nanokvm"

	AppDir    = "/kvmapp"
	BackupDir = "/root/old"
	CacheDir  = "/root/.kvmcache"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

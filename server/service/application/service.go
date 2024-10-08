package application

const (
	VersionURL     = "https://cdn.sipeed.com/nanokvm/latest"
	ApplicationURL = "https://cdn.sipeed.com/nanokvm/latest.zip"
	LibURL         = "https://maixvision.sipeed.com/api/v1/nanokvm/encryption"

	Temporary   = "/tmp/kvmcache"
	Workspace   = "/kvmapp"
	Backup      = "/root/old"
	LibDir      = "/kvmapp/kvm_system/dl_lib"
	LibName     = "libmaixcam_lib.so"
	VersionFile = "/kvmapp/version"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

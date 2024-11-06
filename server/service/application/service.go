package application

const (
	versionURL     = "https://cdn.sipeed.com/nanokvm/latest"
	applicationURL = "https://cdn.sipeed.com/nanokvm/latest.zip"
	libURL         = "https://maixvision.sipeed.com/api/v1/nanokvm/encryption"

	temporary   = "/root/.kvmcache"
	workspace   = "/kvmapp"
	backup      = "/root/old"
	libName     = "libmaixcam_lib.so"
	versionFile = "/kvmapp/version"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

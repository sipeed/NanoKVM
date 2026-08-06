package application

const (
	StableURL  = "https://cdn.sipeed.com/nanokvm"
	PreviewURL = "https://cdn.sipeed.com/nanokvm/preview"

	AppDir    = "/kvmapp"
	BackupDir = "/root/old"
	CacheDir  = "/root/.kvmcache"

	updateWorkspacePrefix = "nanokvm-update-"
	cacheDirMode          = 0o700
	maxPackageSize        = uint64(1 << 30)
	maxExpandedSize       = uint64(2 << 30)
	maxArchiveEntries     = 100_000
	minFreeReserve        = uint64(128 << 20)
	freeReservePercent    = uint64(5)
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

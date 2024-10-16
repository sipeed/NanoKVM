package hid

type Service struct {
	hid *Hid
}

func NewService() *Service {
	return &Service{
		hid: GetHid(),
	}
}

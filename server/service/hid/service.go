package hid

var (
	GHid *Hid
)

type Service struct {
	hid *Hid
}

func (s *Service) GetHid() *Hid {
	return s.hid
}

func NewService() *Service {
	s := &Service{}
	s.hid = newHid(s)
	GHid = s.hid
	return s
}

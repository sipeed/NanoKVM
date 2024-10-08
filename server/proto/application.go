package proto

type GetVersionRsp struct {
	Current string `json:"current"`
	Latest  string `json:"latest"`
}

type GetLibRsp struct {
	Exist bool `json:"exist"`
}

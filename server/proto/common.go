package proto

type EnabledRsp struct {
	Enabled bool `json:"enabled"`
}

type FilesRsp struct {
	Files []string `json:"files"`
}

type FileRsp struct {
	File string `json:"file"`
}

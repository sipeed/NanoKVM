package vm

import (
	"NanoKVM-Server/config"
)

type Service struct {
	config *config.Config
}

func NewService() *Service {
	return &Service{
		config: config.GetInstance(),
	}
}

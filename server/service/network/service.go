package network

import (
	"NanoKVM-Server/service/network/tailscale"

	"github.com/gin-gonic/gin"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) TsInstall(c *gin.Context) {
	tailscale.Install(c)
}

func (s *Service) TsUninstall(c *gin.Context) {
	tailscale.Uninstall(c)
}

func (s *Service) GetTsStatus(c *gin.Context) {
	tailscale.GetStatus(c)
}

func (s *Service) TsUp(c *gin.Context) {
	tailscale.Up(c)
}

func (s *Service) TsDown(c *gin.Context) {
	tailscale.Down(c)
}

func (s *Service) TsLogin(c *gin.Context) {
	tailscale.Login(c)
}

func (s *Service) TsLogout(c *gin.Context) {
	tailscale.Logout(c)
}

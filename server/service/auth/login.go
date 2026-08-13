package auth

import (
	"time"

	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) Login(c *gin.Context) {
	var req proto.LoginReq
	var rsp proto.Response

	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		rsp.OkRspWithData(c, &proto.LoginRsp{Token: "disabled"})
		return
	}

	clientIP := GetClientIP(c)
	if locked, code, msg := CheckLoginAttempt(clientIP); locked {
		time.Sleep(3 * time.Second)
		rsp.ErrRsp(c, code, msg)
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		time.Sleep(3 * time.Second)
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	account, ok := CompareAccount(req.Username, req.Password)
	if !ok {
		time.Sleep(2 * time.Second)
		if locked, code, msg := RecordLoginFailure(clientIP); locked {
			rsp.ErrRsp(c, code, msg)
			return
		}
		rsp.ErrRsp(c, -2, "invalid username or password")
		return
	}

	ClearLoginAttempt(clientIP)

	token, err := middleware.GenerateJWT(account.Username, string(account.Role))
	if err != nil {
		time.Sleep(1 * time.Second)
		rsp.ErrRsp(c, -3, "generate token failed")
		return
	}

	rsp.OkRspWithData(c, &proto.LoginRsp{Token: token})
	log.Debugf("login success, username: %s, role: %s", account.Username, account.Role)
}

func (s *Service) Logout(c *gin.Context) {
	conf := config.GetInstance()
	if conf.JWT.RevokeTokensOnLogout {
		config.RegenerateSecretKey()
	}
	var rsp proto.Response
	rsp.OkRsp(c)
}

func (s *Service) GetAccount(c *gin.Context) {
	var rsp proto.Response

	username, _ := c.Get("username")
	role, _ := c.Get("role")

	rsp.OkRspWithData(c, &proto.GetAccountRsp{
		Username: username.(string),
		Role:     role.(string),
	})
	log.Debugf("get account successful")
}

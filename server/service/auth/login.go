package auth

import (
	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) Login(c *gin.Context) {
	var req proto.LoginReq
	var rsp proto.Response

	// authentication disabled
	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		rsp.OkRspWithData(c, &proto.LoginRsp{
			Token:   "disabled",
			IsAdmin: false,
		})
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	account := CompareAccount(req.Username, req.Password)
	if account == nil {
		rsp.ErrRsp(c, -2, "invalid username or password")
		return
	}

	token, err := middleware.GenerateJWT(req.Username)
	if err != nil {
		rsp.ErrRsp(c, -3, "generate token failed")
		return
	}

	conf.Tokens[token] = &config.User{
		Username:  account.Username,
		Group:     account.Group,
		ExpiresAt: time.Now().Add(3 * time.Hour),
	}

	rsp.OkRspWithData(c, &proto.LoginRsp{
		Token: token,
		IsAdmin: func() bool {
			return account.Group == "admin"
		}(),
	})

	log.Debugf("login success, username: %s", req.Username)
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

	account := GetUserByCookie(c)
	if account == nil {
		rsp.ErrRsp(c, -1, "get account failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetAccountRsp{
		Username: account.Username,
	})
	log.Debugf("get account successful")
}

package auth

import (
	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) Login(c *gin.Context) {
	var req proto.LoginReq
	var rsp proto.Response

	if !isLibExist() {
		rsp.ErrRsp(c, -6, "Lib not exist! Please connect to internet and update.")
		return
	}

	// authentication disabled
	conf := config.GetInstance()
	if conf.Authentication == "disable" {
		rsp.OkRspWithData(c, &proto.LoginRsp{
			Token: "disabled",
		})
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	passwordDecrypt, err := utils.DecodeDecrypt(req.Password)
	if err != nil {
		rsp.ErrRsp(c, -2, "decrypt password failed")
		return
	}

	account, err := utils.GetAccount()
	if err != nil {
		rsp.ErrRsp(c, -3, "get account failed")
		return
	}

	if req.Username != account.Username || passwordDecrypt != account.Password {
		rsp.ErrRsp(c, -4, "invalid username or password")
		return
	}

	token, err := middleware.GenerateJWT(req.Username)
	if err != nil {
		rsp.ErrRsp(c, -5, "generate token failed")
		return
	}

	rsp.OkRspWithData(c, &proto.LoginRsp{
		Token: token,
	})

	log.Debugf("login success, username: %s", req.Username)
}

func (s *Service) GetAccount(c *gin.Context) {
	var rsp proto.Response

	account, err := utils.GetAccount()
	if err != nil {
		rsp.ErrRsp(c, -1, "get account failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetAccountRsp{
		Username: account.Username,
	})
	log.Debugf("get account successful")
}

func isLibExist() bool {
	libPath := fmt.Sprintf("/kvmapp/kvm_system/dl_lib/libmaixcam_lib.so")
	_, err := os.Stat(libPath)
	return err == nil
}

package auth

import (
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) ChangePassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	if err := setAccount(req.Username, req.Password); err != nil {
		rsp.ErrRsp(c, -2, "change password failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("change password success, username: %s", req.Username)
}

func (s *Service) IsPasswordUpdated(c *gin.Context) {
	var rsp proto.Response

	account, err := getAccount()
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to get password")
	}

	isUpdated := true
	if account == nil || account.Password == "admin" {
		isUpdated = false
	}

	rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{
		IsUpdated: isUpdated,
	})
	log.Debugf("get password success")
}

package auth

import (
	"errors"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var errInvalidPassword = errors.New("invalid password")

func (s *Service) ListUsers(c *gin.Context) {
	var rsp proto.Response
	users, err := authn.DefaultStore.List()
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to load users")
		return
	}
	result := make([]proto.UserInfo, 0, len(users))
	for _, user := range users {
		result = append(result, proto.UserInfo{
			Username:      user.Username,
			Role:          string(user.Role),
			Enabled:       user.Enabled,
			SystemAccount: user.SystemAccount,
		})
	}
	rsp.OkRspWithData(c, &proto.ListUsersRsp{Users: result})
}

func (s *Service) CreateUser(c *gin.Context) {
	var req proto.CreateUserReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	password, err := decodePassword(req.Password)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	if err = authn.DefaultStore.Create(req.Username, password, authn.Role(req.Role)); err != nil {
		rsp.ErrRsp(c, -3, err.Error())
		return
	}
	rsp.OkRsp(c)
	log.Infof("user created: %s (%s)", req.Username, req.Role)
}

func (s *Service) UpdateUser(c *gin.Context) {
	var req proto.UpdateUserReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil || (req.Role == nil && req.Enabled == nil) {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	principal, _ := middleware.CurrentPrincipal(c)
	patch := authn.UserPatch{Enabled: req.Enabled}
	if req.Role != nil {
		role := authn.Role(*req.Role)
		patch.Role = &role
	}
	username := c.Param("username")
	if _, err := authn.DefaultStore.Update(principal.Username, username, patch); err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	middleware.RevokeUserSessions(username)
	rsp.OkRsp(c)
	log.Infof("user updated: %s", username)
}

func (s *Service) DeleteUser(c *gin.Context) {
	var rsp proto.Response
	principal, _ := middleware.CurrentPrincipal(c)
	username := c.Param("username")
	if err := authn.DefaultStore.Delete(principal.Username, username); err != nil {
		rsp.ErrRsp(c, -1, err.Error())
		return
	}
	middleware.RevokeUserSessions(username)
	rsp.OkRsp(c)
	log.Infof("user deleted: %s", username)
}

func (s *Service) ChangeUserPassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	username := c.Param("username")
	user, err := authn.DefaultStore.Get(username)
	if err != nil {
		rsp.ErrRsp(c, -2, err.Error())
		return
	}
	if user.SystemAccount {
		rsp.ErrRsp(c, -3, "the device owner must change its own password")
		return
	}
	if err := changeUserPassword(username, req.Password); err != nil {
		rsp.ErrRsp(c, -4, err.Error())
		return
	}
	middleware.RevokeUserSessions(username)
	rsp.OkRsp(c)
	log.Infof("password reset for user: %s", username)
}

func decodePassword(encrypted string) (string, error) {
	password, err := utils.DecodeDecrypt(encrypted)
	if err != nil || password == "" {
		return "", errInvalidPassword
	}
	if err = authn.ValidatePassword(password); err != nil {
		return "", err
	}
	return password, nil
}

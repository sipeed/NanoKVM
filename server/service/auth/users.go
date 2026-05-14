package auth

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

// ListUsers returns all user accounts (passwords excluded).
func (s *Service) ListUsers(c *gin.Context) {
	var rsp proto.Response

	accounts, err := GetAccounts()
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to load users")
		return
	}

	users := make([]proto.UserInfo, 0, len(accounts))
	for _, a := range accounts {
		users = append(users, proto.UserInfo{
			Username: a.Username,
			Role:     string(a.Role),
			Enabled:  a.Enabled,
		})
	}

	rsp.OkRspWithData(c, &proto.ListUsersRsp{Users: users})
}

// CreateUser adds a new user (admin only).
func (s *Service) CreateUser(c *gin.Context) {
	var req proto.CreateUserReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	role := Role(req.Role)
	if !IsValidRole(role) {
		rsp.ErrRsp(c, -2, "invalid role; must be admin, operator, or viewer")
		return
	}

	password, err := utils.DecodeDecrypt(req.Password)
	if err != nil || password == "" {
		rsp.ErrRsp(c, -3, "invalid password")
		return
	}

	if err = AddAccount(req.Username, password, role); err != nil {
		rsp.ErrRsp(c, -4, err.Error())
		return
	}

	rsp.OkRsp(c)
	log.Infof("user created: %s (role: %s)", req.Username, role)
}

// UpdateUser changes a user's role or enabled status (admin only).
func (s *Service) UpdateUser(c *gin.Context) {
	var req proto.UpdateUserReq
	var rsp proto.Response

	username := c.Param("username")
	if username == "" {
		rsp.ErrRsp(c, -1, "username is required")
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -2, "invalid parameters")
		return
	}

	if req.Role != "" {
		role := Role(req.Role)
		if !IsValidRole(role) {
			rsp.ErrRsp(c, -3, "invalid role; must be admin, operator, or viewer")
			return
		}
		if err := UpdateAccountRole(username, role); err != nil {
			rsp.ErrRsp(c, -4, err.Error())
			return
		}
		log.Infof("user role updated: %s -> %s", username, role)
	}

	if req.Enabled != nil {
		if err := SetAccountEnabled(username, *req.Enabled); err != nil {
			rsp.ErrRsp(c, -5, err.Error())
			return
		}
		log.Infof("user enabled state updated: %s -> %v", username, *req.Enabled)
	}

	rsp.OkRsp(c)
}

// DeleteUser removes a user account (admin only).
func (s *Service) DeleteUser(c *gin.Context) {
	var rsp proto.Response

	username := c.Param("username")
	if username == "" {
		rsp.ErrRsp(c, -1, "username is required")
		return
	}

	// Prevent an admin from deleting themselves.
	selfUsername, _ := c.Get("username")
	if selfUsername.(string) == username {
		rsp.ErrRsp(c, -2, "cannot delete your own account")
		return
	}

	if err := DeleteAccount(username); err != nil {
		rsp.ErrRsp(c, -3, err.Error())
		return
	}

	rsp.OkRsp(c)
	log.Infof("user deleted: %s", username)
}

// ChangeUserPassword allows an admin to set any user's password,
// or a user to change their own password.
func (s *Service) ChangeUserPassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response

	username := c.Param("username")
	if username == "" {
		rsp.ErrRsp(c, -1, "username is required")
		return
	}

	selfUsername, _ := c.Get("username")
	selfRole, _ := c.Get("role")

	// Only admins may change other users' passwords.
	if selfRole.(string) != "admin" && selfUsername.(string) != username {
		rsp.ErrRsp(c, -2, "permission denied")
		return
	}

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -3, "invalid parameters")
		return
	}

	password, err := utils.DecodeDecrypt(req.Password)
	if err != nil || password == "" {
		rsp.ErrRsp(c, -4, "invalid password")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		rsp.ErrRsp(c, -5, "failed to hash password")
		return
	}

	if err = UpdateAccountPassword(username, string(hashed)); err != nil {
		rsp.ErrRsp(c, -6, err.Error())
		return
	}

	rsp.OkRsp(c)
	log.Infof("password changed for user: %s", username)
}

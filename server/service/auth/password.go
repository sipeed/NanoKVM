package auth

import (
	"io"
	"os"
	"os/exec"
	"time"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/config"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var systemPasswordUpdater = changeRootPassword

func (s *Service) ChangePassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}
	principal, ok := middleware.CurrentPrincipal(c)
	if !ok {
		rsp.ErrRsp(c, -2, "invalid session")
		return
	}
	currentPassword, err := utils.DecodeDecrypt(req.CurrentPassword)
	if err != nil || currentPassword == "" {
		rsp.ErrRsp(c, -3, "current password is required")
		return
	}
	if _, authenticated, authErr := authn.DefaultStore.Authenticate(principal.Username, currentPassword); authErr != nil {
		rsp.ErrRsp(c, -4, "authentication unavailable")
		return
	} else if !authenticated {
		rsp.ErrRsp(c, -3, "current password is incorrect")
		return
	}
	if err := changeUserPassword(principal.Username, req.Password); err != nil {
		rsp.ErrRsp(c, -5, err.Error())
		return
	}

	middleware.RevokeUserSessions(principal.Username)
	clearSessionCookie(c)
	rsp.OkRsp(c)
	log.Infof("password changed for user: %s", principal.Username)
}

func (s *Service) IsPasswordUpdated(c *gin.Context) {
	var rsp proto.Response
	if config.GetInstance().Authentication == "disable" {
		rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{IsUpdated: true})
		return
	}
	principal, ok := middleware.CurrentPrincipal(c)
	if !ok {
		rsp.ErrRsp(c, -1, "invalid session")
		return
	}
	user, err := authn.DefaultStore.Get(principal.Username)
	if err != nil {
		rsp.ErrRsp(c, -2, "failed to get password state")
		return
	}
	rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{IsUpdated: !user.MustChangePassword})
}

func changeUserPassword(username, encryptedPassword string) error {
	password, err := utils.DecodeDecrypt(encryptedPassword)
	if err != nil || password == "" {
		return errInvalidPassword
	}
	if err = authn.ValidatePassword(password); err != nil {
		return err
	}
	user, err := authn.DefaultStore.Get(username)
	if err != nil {
		return err
	}
	if user.SystemAccount && user.Role == authn.RoleAdmin && user.Enabled {
		_, err = authn.DefaultStore.SetPasswordAndRun(username, password, func() error {
			return systemPasswordUpdater(password)
		})
		return err
	}
	_, err = authn.DefaultStore.SetPassword(username, password)
	return err
}

func changeRootPassword(password string) error {
	if err := passwd(password); err != nil {
		log.Errorf("failed to change root password: %s", err)
		return err
	}
	log.Debug("change root password successful")
	return nil
}

func passwd(password string) error {
	cmd := exec.Command("passwd", "root")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	defer func() { _ = stdin.Close() }()
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err = cmd.Start(); err != nil {
		return err
	}
	if _, err = io.WriteString(stdin, password+"\n"); err != nil {
		return err
	}
	time.Sleep(100 * time.Millisecond)
	if _, err = io.WriteString(stdin, password+"\n"); err != nil {
		return err
	}
	return cmd.Wait()
}

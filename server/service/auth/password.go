package auth

import (
	"errors"
	"io"
	"os"
	"os/exec"
	"time"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

// ChangePassword allows a user to change their own password (legacy endpoint).
// If the request contains no username, the current logged-in user is used.
func (s *Service) ChangePassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	selfUsername, _ := c.Get("username")
	selfRole, _ := c.Get("role")

	// If no username given, default to the current user.
	if req.Username == "" {
		req.Username = selfUsername.(string)
	}

	// Only admins may change other accounts; others can only change their own.
	if selfRole.(string) != "admin" && selfUsername.(string) != req.Username {
		rsp.ErrRsp(c, -2, "permission denied")
		return
	}

	password, err := utils.DecodeDecrypt(req.Password)
	if err != nil || password == "" {
		rsp.ErrRsp(c, -3, "invalid password")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		rsp.ErrRsp(c, -4, "failed to hash password")
		return
	}

	if err = UpdateAccountPassword(req.Username, string(hashedPassword)); err != nil {
		rsp.ErrRsp(c, -5, "failed to save password")
		return
	}

	// Only change the root system password when the admin changes their own password.
	if req.Username == "admin" {
		if err = changeRootPassword(password); err != nil {
			log.Warnf("failed to change root password: %s", err)
		}
	}

	rsp.OkRsp(c)
	log.Debugf("password changed for user: %s", req.Username)
}

// IsPasswordUpdated reports whether the admin password has been changed from the default.
func (s *Service) IsPasswordUpdated(c *gin.Context) {
	var rsp proto.Response

	account, err := GetAccountByUsername("admin")
	if err != nil {
		rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{IsUpdated: false})
		return
	}

	checkErr := bcrypt.CompareHashAndPassword([]byte(account.Password), []byte("admin"))
	rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{
		IsUpdated: errors.Is(checkErr, bcrypt.ErrMismatchedHashAndPassword),
	})
}

func changeRootPassword(password string) error {
	err := passwd(password)
	if err != nil {
		log.Errorf("failed to change root password: %s", err)
		return err
	}
	log.Debugf("root password changed successfully")
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

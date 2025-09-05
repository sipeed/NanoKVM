package auth

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"errors"
	"io"
	"os"
	"os/exec"
	"time"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

func (s *Service) ChangePassword(c *gin.Context) {
	var req proto.ChangePasswordReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid parameters")
		return
	}

	password, err := utils.DecodeDecrypt(req.Password)
	if err != nil || password == "" {
		rsp.ErrRsp(c, -2, "invalid password")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		rsp.ErrRsp(c, -3, "failed to hash password")
		return
	}

	user := GetUserByCookie(c)
	if user != nil {
		// change user password
		userName := user.Username
		if user.Group == "admin" {
			userName = req.Username
		}

		if err = SetAccount(userName, string(hashedPassword)); err != nil {
			rsp.ErrRsp(c, -4, "failed to save password")
			return
		}

		// change root password
		if user.Username == "admin" {
			err = changeRootPassword(password)
			if err != nil {
				_ = DelAccount()
				rsp.ErrRsp(c, -5, "failed to change password")
				return
			}
		}
	}

	rsp.OkRsp(c)
	log.Debugf("change password success, username: %s", req.Username)
}

func (s *Service) IsPasswordUpdated(c *gin.Context) {
	var rsp proto.Response

	if _, err := os.Stat(AccountFile); err != nil {
		rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{
			IsUpdated: false,
		})
		return
	}

	account, err := GetAccount()
	if err != nil || account == nil {
		rsp.ErrRsp(c, -1, "failed to get password")
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte("admin"))

	rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{
		// If the hash is not valid, still assume it's not updated
		// The error we want to see is password and hash not matching
		IsUpdated: errors.Is(err, bcrypt.ErrMismatchedHashAndPassword),
	})
}

func changeRootPassword(password string) error {
	err := passwd(password)
	if err != nil {
		log.Errorf("failed to change root password: %s", err)
		return err
	}

	log.Debugf("change root password successful.")
	return nil
}

func passwd(password string) error {
	cmd := exec.Command("passwd", "root")

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	defer func() {
		_ = stdin.Close()
	}()

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

	if err = cmd.Wait(); err != nil {
		return err
	}

	return nil
}

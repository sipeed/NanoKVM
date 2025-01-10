package auth

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"io"
	"os"
	"os/exec"
	"time"

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

	err := utils.SetAccount(req.Username, req.Password)
	if err != nil {
		rsp.ErrRsp(c, -2, "failed to save password")
		return
	}

	account, err := utils.GetAccount()
	if err != nil {
		rsp.ErrRsp(c, -3, "failed to get password")
		return
	}

	// change root password
	err = changeRootPassword(account.Password)
	if err != nil {
		_ = utils.DelAccount()
		rsp.ErrRsp(c, -4, "failed to change password")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("change password success, username: %s", req.Username)
}

func (s *Service) IsPasswordUpdated(c *gin.Context) {
	var rsp proto.Response

	isUpdated := false

	if utils.IsAccountExist() {
		account, err := utils.GetAccount()
		if err != nil {
			rsp.ErrRsp(c, -1, "failed to get password")
			return
		}

		if account != nil && account.Password != "admin" {
			isUpdated = true
		}
	}

	rsp.OkRspWithData(c, &proto.IsPasswordUpdatedRsp{
		IsUpdated: isUpdated,
	})
	log.Debugf("is password updated: %t", isUpdated)
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

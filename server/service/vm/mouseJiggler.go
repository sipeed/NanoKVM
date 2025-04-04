package vm

import (
	"NanoKVM-Server/proto"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	MouseJigglerStartFlag    = "/var/run/mouse-jiggler.pid"
	MouseJigglerScript       = "/etc/init.d/S50mouse-jiggler"
	MouseJigglerBackupScript = "/kvmapp/system/init.d/S50mouse-jiggler"
)

func (s *Service) GetMouseJigglerState(c *gin.Context) {
	var rsp proto.Response

	enabled := isMouseJigglerEnabled()
	rsp.OkRspWithData(c, &proto.GetMouseJigglerStateRsp{
		Enabled: enabled,
	})
}

func (s *Service) EnableMouseJiggler(c *gin.Context) {
	var rsp proto.Response

	commands := []string{
		fmt.Sprintf("cp -f %s %s", MouseJigglerBackupScript, MouseJigglerScript),
		fmt.Sprintf("chmod +x %s", MouseJigglerScript),
		fmt.Sprintf("dos2unix %s", MouseJigglerScript),
		fmt.Sprintf("%s start", MouseJigglerScript),
	}

	command := strings.Join(commands, " && ")
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("failed to run MouseJiggler script: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("MouseJiggler enabled")
}

func (s *Service) DisableMouseJiggler(c *gin.Context) {
	var rsp proto.Response

	command := fmt.Sprintf("%s stop", MouseJigglerScript)
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("failed to run MouseJiggler script: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	_ = os.Remove(MouseJigglerScript)

	rsp.OkRsp(c)
	log.Debugf("MouseJiggler disabled")
}

func isMouseJigglerEnabled() bool {
	_, err := os.Stat(MouseJigglerStartFlag)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return false
		}
	}
	return true
}

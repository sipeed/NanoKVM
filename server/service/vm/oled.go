package vm

import (
	"NanoKVM-Server/proto"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	OLEDExistFile = "/etc/kvm/oled_exist"
	OLEDSleepFile = "/etc/kvm/oled_sleep"
)

func (s *Service) SetOLED(c *gin.Context) {
	var req proto.SetOledReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	data := []byte(fmt.Sprintf("%d", req.Sleep))
	err := os.WriteFile(OLEDSleepFile, data, 0o644)
	if err != nil {
		rsp.ErrRsp(c, -2, "failed to write data")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set OLED sleep: %d", req.Sleep)
}

func (s *Service) GetOLED(c *gin.Context) {
	var rsp proto.Response

	if _, err := os.Stat(OLEDExistFile); err != nil {
		rsp.OkRspWithData(c, &proto.GetOLEDRsp{
			Exist: false,
			Sleep: 0,
		})
		return
	}

	data, err := os.ReadFile(OLEDSleepFile)
	if err != nil {
		rsp.OkRspWithData(c, &proto.GetOLEDRsp{
			Exist: true,
			Sleep: 0,
		})
		return
	}

	content := strings.TrimSpace(string(data))
	sleep, err := strconv.Atoi(content)
	if err != nil {
		log.Errorf("failed to parse OLED: %s", err)
		rsp.ErrRsp(c, -1, "failed to parse OLED config")
		return
	}

	rsp.OkRspWithData(c, &proto.GetOLEDRsp{
		Exist: true,
		Sleep: sleep,
	})
	log.Debugf("get OLED config successful, sleep %d", sleep)
}

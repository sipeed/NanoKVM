package vm

import (
	"NanoKVM-Server/proto"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	OLEDExistFile    = "/etc/kvm/oled_exist"
	OLEDSleepFile    = "/etc/kvm/oled_sleep"
	defaultOLEDSleep = 60
)

func validOLEDSleep(sleep int) bool {
	return sleep == 0 || (sleep >= 10 && sleep <= 3600)
}

func readOLEDSleep() (int, error) {
	data, err := os.ReadFile(OLEDSleepFile)
	if errors.Is(err, os.ErrNotExist) {
		return defaultOLEDSleep, nil
	}
	if err != nil {
		return 0, err
	}
	sleep, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil || !validOLEDSleep(sleep) {
		return 0, errors.New("invalid OLED sleep setting")
	}
	return sleep, nil
}

func writeFileAtomic(path string, data []byte) error {
	tmp, err := os.CreateTemp(filepath.Dir(path), ".oled-sleep-*")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)
	if err = tmp.Chmod(0o644); err == nil {
		_, err = tmp.Write(data)
	}
	if err == nil {
		err = tmp.Sync()
	}
	if closeErr := tmp.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	return os.Rename(tmpPath, path)
}

func (s *Service) SetOLED(c *gin.Context) {
	var req proto.SetOledReq
	var rsp proto.Response
	if err := proto.ParseFormRequest(c, &req); err != nil || req.Sleep == nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}
	if !validOLEDSleep(*req.Sleep) {
		rsp.ErrRsp(c, -1, "sleep must be 0 or between 10 and 3600 seconds")
		return
	}
	if err := writeFileAtomic(OLEDSleepFile, []byte(strconv.Itoa(*req.Sleep)+"\n")); err != nil {
		rsp.ErrRsp(c, -2, "failed to write OLED sleep setting")
		return
	}
	rsp.OkRsp(c)
	log.Debugf("set OLED sleep: %d", *req.Sleep)
}

func (s *Service) GetOLED(c *gin.Context) {
	var rsp proto.Response
	if _, err := os.Stat(OLEDExistFile); err != nil {
		rsp.OkRspWithData(c, &proto.GetOLEDRsp{Exist: false})
		return
	}
	sleep, err := readOLEDSleep()
	if err != nil {
		log.Errorf("failed to parse OLED sleep setting: %s", err)
		rsp.ErrRsp(c, -1, "failed to parse OLED sleep setting")
		return
	}
	rsp.OkRspWithData(c, &proto.GetOLEDRsp{Exist: true, Sleep: sleep})
}

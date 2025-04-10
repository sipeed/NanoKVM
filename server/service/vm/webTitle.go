package vm

import (
	"NanoKVM-Server/proto"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const (
	WebTitleFile = "/etc/kvm/web_title"
)

func init() {
	if _, err := os.Stat(WebTitleFile); os.IsNotExist(err) {
		err := ioutil.WriteFile(WebTitleFile, []byte("NanoKVM"), 0644)

		if err != nil {
			log.Errorf("Create Web Title file failed: %s", WebTitleFile)
			return
		}

		log.Debugf("Create Web Title file: %s", WebTitleFile)
	}
}

func (s *Service) SetWebTitle(c *gin.Context) {
	var req proto.SetWebTitleReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	data := []byte(fmt.Sprintf("%s", req.WebTitle))

	err := os.WriteFile(WebTitleFile, data, 0o644)
	if err != nil {
		rsp.ErrRsp(c, -2, "failed to write data")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set WebTitle: %s", req.WebTitle)
}

func (s *Service) GetWebTitle(c *gin.Context) {
	var rsp proto.Response

	data, err := os.ReadFile(WebTitleFile)
	if err != nil {
		rsp.ErrRsp(c, -1, "read WebTitle failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetWebTitleRsp{
		WebTitle: strings.Replace(string(data), "\n", "", -1),
	})

	log.Debugf("get WebTitle successful")
}

package vm

import (
	"NanoKVM-Server/proto"
	"fmt"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const autostartDirectory = "/etc/kvm/autostart"

func (s *Service) GetAutostart(c *gin.Context) {
	var rsp proto.Response

	var files []string
	err := filepath.Walk(autostartDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			files = append(files, info.Name())
		}

		return nil
	})
	if err != nil {
		rsp.ErrRsp(c, -1, "get autostart directory fail")
		return
	}
	rsp.OkRspWithData(c, &proto.GetAutostartRsp{
		Files: files,
	})

	log.Debugf("get autostart total %d", len(files))
}

func (s *Service) UploadAutostart(c *gin.Context) {
	var req proto.UploadAutostartReq
	var rsp proto.Response

	fileName := c.Param("name")

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "parse form request fail")
		return
	}

	if _, err := os.Stat(autostartDirectory); err != nil {
		_ = os.MkdirAll(autostartDirectory, 0o755)
	}

	target := fmt.Sprintf("%s/%s", autostartDirectory, fileName)

	f, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o755)
	if err != nil {
		rsp.ErrRsp(c, -1, "create file fail")
		return
	}

	defer f.Close()
	_, err = f.WriteString(req.Content)
	if err != nil {
		rsp.ErrRsp(c, -1, "write content fail")
		return
	}

	rsp.OkRspWithData(c, fileName)

	log.Debugf("upload autostart %s success", fileName)
}

func (s *Service) DeleteAutostart(c *gin.Context) {
	var rsp proto.Response

	fileName := c.Param("name")

	file := fmt.Sprintf("%s/%s", autostartDirectory, fileName)
	if err := os.Remove(file); err != nil {
		log.Errorf("delete autostart file %s fail", fileName)
		rsp.ErrRsp(c, -3, "remove file fail")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete autostart %s success", fileName)
}

func (s *Service) GetAutostartContent(c *gin.Context) {
	var rsp proto.Response
	fileName := c.Param("name")
	file := fmt.Sprintf("%s/%s", autostartDirectory, fileName)
	content, err := os.ReadFile(file)
	if err != nil {
		rsp.ErrRsp(c, -1, "read file fail")
		return
	}

	rsp.OkRspWithData(c, string(content))
	log.Debugf("get autostart content %s success", fileName)
}

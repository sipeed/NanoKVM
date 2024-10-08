package network

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"bufio"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strings"
)

const (
	TailscalePath  = "/usr/bin/tailscale"
	TailscaledPath = "/usr/sbin/tailscaled"
)

type TailscaleStatus struct {
	BackendState string `json:"BackendState"`

	Self struct {
		HostName     string   `json:"HostName"`
		TailscaleIPs []string `json:"TailscaleIPs"`
	} `json:"Self"`

	CurrentTailnet struct {
		Name string `json:"Name"`
	} `json:"CurrentTailnet"`
}

func (s *Service) InstallTailscale(c *gin.Context) {
	var rsp proto.Response

	if exist := isTailscaleExist(); exist {
		rsp.OkRsp(c)
		return
	}

	var (
		downloadUrl = "http://cdn.sipeed.com/nanokvm/resources/tailscale_riscv64.zip"
		workspace   = "/root/.tailscale"

		zipFile    = fmt.Sprintf("%s/tailscale_riscv64.zip", workspace)
		tailscale  = fmt.Sprintf("%s/tailscale_riscv64/tailscale", workspace)
		tailscaled = fmt.Sprintf("%s/tailscale_riscv64/tailscaled", workspace)
	)

	// download
	_ = os.MkdirAll(workspace, 0755)
	defer exec.Command("sh", "-c", fmt.Sprintf("rm -rf %s", workspace)).Run()

	req, err := http.NewRequest("GET", downloadUrl, nil)
	if err != nil {
		log.Errorf("new request err: %s", err)
		rsp.ErrRsp(c, -1, "request failed")
		return
	}

	err = utils.Download(req, zipFile)
	if err != nil {
		rsp.ErrRsp(c, -2, "download failed")
		return
	}

	// install
	command := fmt.Sprintf("unzip %s -d %s", zipFile, workspace)
	err = exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("unzip failed: %s", err)
		rsp.ErrRsp(c, -3, "unzip failed")
		return
	}

	err = os.Rename(tailscale, TailscalePath)
	if err != nil {
		log.Debugf("rename %s failed: %s", tailscale, err)
	}
	err = os.Rename(tailscaled, TailscaledPath)
	if err != nil {
		log.Debugf("rename %s failed: %s", tailscaled, err)
	}

	_ = runTailscale()

	rsp.OkRsp(c)
	log.Debugf("install tailscaled success")
}

func (s *Service) LoginTailscale(c *gin.Context) {
	var rsp proto.Response

	status, err := getTailscaleStatus()
	if err != nil {
		_ = runTailscale()
		status, err = getTailscaleStatus()
	}

	if err != nil {
		rsp.ErrRsp(c, -1, "tailscale unknown status")
		return
	}

	if status.BackendState == "Running" {
		rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{
			Status: "running",
		})
		return
	}

	cmd := exec.Command("sh", "-c", "tailscale login --timeout=10m")
	stderr, err := cmd.StderrPipe()
	if err != nil {
		rsp.ErrRsp(c, -2, "tailscale login failed")
		return
	}

	defer stderr.Close()

	go cmd.Run()

	url := parseLoginUrl(stderr)
	rsp.OkRspWithData(c, &proto.LoginTailscaleRsp{
		Status: "notLogin",
		Url:    url,
	})
	log.Debugf("tailscale login url: %s", url)
}

func (s *Service) LogoutTailscale(c *gin.Context) {
	var rsp proto.Response

	cmd := exec.Command("sh", "-c", "tailscale logout")
	err := cmd.Run()
	if err != nil {
		rsp.ErrRsp(c, -2, "tailscale logout failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("tailscale logout success")
}

func (s *Service) GetTailscaleStatus(c *gin.Context) {
	var rsp proto.Response
	var data proto.GetTailscaleStatusRsp

	if exist := isTailscaleExist(); !exist {
		data.Status = "notInstall"
		rsp.OkRspWithData(c, data)
		return
	}

	status, err := getTailscaleStatus()
	if err != nil {
		data.Status = "notLogin"
		rsp.OkRspWithData(c, data)
		return
	}

	switch status.BackendState {
	case "NeedsLogin":
		data.Status = "notLogin"
	case "Running":
		data.Status = "running"
	case "Stopped":
		data.Status = "stopped"
	default:
		rsp.ErrRsp(c, -1, "unknown state")
		return
	}

	for _, tailscaleIp := range status.Self.TailscaleIPs {
		ip := net.ParseIP(tailscaleIp)
		if ip != nil && ip.To4() != nil {
			data.IP = ip.String()
		}
	}

	data.Name = status.Self.HostName
	data.Account = status.CurrentTailnet.Name

	rsp.OkRspWithData(c, data)
	log.Debugf("tailscale status: %s", data.Status)
}

func (s *Service) UpdateTailscaleStatus(c *gin.Context) {
	var req proto.UpdateTailscaleStatusReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	command := fmt.Sprintf("tailscale %s", req.Command)
	err := exec.Command("sh", "-c", command).Run()
	if err != nil {
		msg := fmt.Sprintf("tailscale %s failed", req.Command)
		rsp.ErrRsp(c, -2, msg)
		return
	}

	status, err := getTailscaleStatus()
	if err != nil {
		rsp.ErrRsp(c, -3, "get tailscale status failed")
		return
	}

	data := &proto.UpdateTailscaleStatusRsp{}

	if status.BackendState == "Running" {
		data.Status = "running"
	} else if status.BackendState == "Stopped" {
		data.Status = "stopped"
	} else {
		rsp.ErrRsp(c, -4, "unknown tailscale status")
		return
	}

	rsp.OkRspWithData(c, data)
	log.Debugf("tailscale %s success", req.Command)
}

func isTailscaleExist() bool {
	_, err1 := os.Stat(TailscalePath)
	_, err2 := os.Stat(TailscaledPath)

	return err1 == nil && err2 == nil
}

func runTailscale() error {
	for _, filePath := range []string{TailscalePath, TailscaledPath} {
		if err := utils.EnsurePermission(filePath, 0100); err != nil {
			return err
		}
	}

	err := exec.Command("sh", "-c", "/etc/init.d/S98tailscaled start").Run()
	if err != nil {
		return err
	}

	return nil
}

func getTailscaleStatus() (TailscaleStatus, error) {
	var status TailscaleStatus

	command := "tailscale status --json"
	cmd := exec.Command("sh", "-c", command)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Debugf("get tailscale status failed: %s", err)
		return status, err
	}

	// delete warning message
	if str := string(output); !strings.HasPrefix(str, "{") {
		index := strings.Index(str, "{")
		if index != -1 {
			output = []byte(str[index:])
		}
	}

	err = json.Unmarshal(output, &status)
	if err != nil {
		log.Debugf("unmarshal tailscale status failed: %s", err)
		return status, err
	}

	return status, nil
}

func parseLoginUrl(r io.Reader) string {
	reader := bufio.NewReader(r)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			log.Errorf("reading line failed: %s", err)
			return ""
		}

		if strings.Contains(line, "https") {
			reg := regexp.MustCompile("\\s+")
			return reg.ReplaceAllString(line, "")
		}
	}
}

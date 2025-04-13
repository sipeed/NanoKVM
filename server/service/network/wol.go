package network

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
)

const (
	WolMacFile = "/etc/kvm/cache/wol"
)

func (s *Service) WakeOnLAN(c *gin.Context) {
	var req proto.WakeOnLANReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	mac, err := parseMAC(req.Mac)
	if err != nil {
		rsp.ErrRsp(c, -2, "invalid MAC address")
		return
	}

	command := fmt.Sprintf("ether-wake -b %s", mac)
	cmd := exec.Command("sh", "-c", command)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Errorf("failed to wake on lan: %s", err)
		rsp.ErrRsp(c, -3, string(output))
		return
	}

	go saveMac(mac)

	rsp.OkRsp(c)
	log.Debugf("wake on lan: %s", mac)
}

func (s *Service) GetMac(c *gin.Context) {
	var rsp proto.Response

	content, err := os.ReadFile(WolMacFile)
	if err != nil {
		rsp.ErrRsp(c, -2, "open file error")
		return
	}

	data := &proto.GetMacRsp{
		Macs: strings.Split(string(content), "\n"),
	}

	rsp.OkRspWithData(c, data)
}

func (s *Service) SetMacName(c *gin.Context) {
	var req proto.SetMacNameReq // Mac:string Name:string
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	content, err := os.ReadFile(WolMacFile)
	if err != nil {
		log.Errorf("failed to open %s: %s", WolMacFile, err)
		rsp.ErrRsp(c, -2, "read failed")
		return
	}

	macs := strings.Split(string(content), "\n")
	var newLines []string
	macFound := false

	for _, line := range macs {
		parts := strings.Split(line, " ")
		if req.Mac != parts[0] {
			newLines = append(newLines, line)
			continue
		}
		newLines = append(newLines, parts[0]+" "+req.Name)
		macFound = true
	}

	if !macFound {
		log.Errorf("failed to found mac %s: %s", req.Mac, err)
		rsp.ErrRsp(c, -3, "write failed")
		return
	}

	data := strings.Join(newLines, "\n")
	err = os.WriteFile(WolMacFile, []byte(data), 0o644)
	if err != nil {
		log.Errorf("failed to write %s: %s", WolMacFile, err)
		rsp.ErrRsp(c, -3, "write failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set wol mac name: %s %s", req.Mac, req.Name)
}

func (s *Service) DeleteMac(c *gin.Context) {
	var req proto.DeleteMacReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	content, err := os.ReadFile(WolMacFile)
	if err != nil {
		log.Errorf("failed to open %s: %s", WolMacFile, err)
		rsp.ErrRsp(c, -2, "read failed")
		return
	}

	macs := strings.Split(string(content), "\n")
	var newMacs []string

	for _, mac := range macs {
		parts := strings.Split(mac, " ")
		if req.Mac != parts[0] {
			newMacs = append(newMacs, mac)
		}
	}

	data := strings.Join(newMacs, "\n")
	err = os.WriteFile(WolMacFile, []byte(data), 0o644)
	if err != nil {
		log.Errorf("failed to write %s: %s", WolMacFile, err)
		rsp.ErrRsp(c, -3, "write failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete wol mac: %s", req.Mac)
}

func parseMAC(mac string) (string, error) {
	mac = strings.ToUpper(strings.TrimSpace(mac))

	mac = strings.ReplaceAll(mac, "-", "")
	mac = strings.ReplaceAll(mac, ":", "")
	mac = strings.ReplaceAll(mac, ".", "")

	matched, err := regexp.MatchString("^[0-9A-F]{12}$", mac)
	if err != nil {
		return "", err
	}
	if !matched {
		return "", fmt.Errorf("invalid MAC address: %s", mac)
	}

	var result strings.Builder
	for i := 0; i < 12; i += 2 {
		if i > 0 {
			result.WriteString(":")
		}
		result.WriteString(mac[i : i+2])
	}

	return result.String(), nil
}

func saveMac(mac string) {
	if isMacExist(mac) {
		return
	}

	err := os.MkdirAll(filepath.Dir(WolMacFile), 0o644)
	if err != nil {
		log.Errorf("failed to create dir: %s", err)
		return
	}

	file, err := os.OpenFile(WolMacFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		log.Errorf("failed to open %s: %s", WolMacFile, err)
		return
	}
	defer func() {
		_ = file.Close()
	}()

	content := fmt.Sprintf("%s\n", mac)
	_, err = file.WriteString(content)
	if err != nil {
		log.Errorf("failed to write %s: %s", WolMacFile, err)
		return
	}
}

func isMacExist(mac string) bool {
	content, err := os.ReadFile(WolMacFile)
	if err != nil {
		return false
	}

	macs := strings.Split(string(content), "\n")
	for _, item := range macs {
		parts := strings.Split(item, " ")
		if mac == parts[0] {
			return true
		}
	}

	return false
}

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
	SwapFile    = "/swapfile"
	SwapSize    = "128M"
	InittabPath = "/etc/inittab"
	TempInittab = "/etc/inittab.tmp"
)

func (s *Service) GetSwapState(c *gin.Context) {
	var rsp proto.Response

	enabled := isSwapEnabled()
	rsp.OkRspWithData(c, &proto.GetSwapStateRsp{
		Enabled: enabled,
	})
}

func (s *Service) EnableSwap(c *gin.Context) {

	var rsp proto.Response

	if err := exec.Command("fallocate", "-l", SwapSize, SwapFile).Run(); err != nil {
		log.Errorf("create swap partition failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := exec.Command("chmod", "600", SwapFile).Run(); err != nil {
		log.Errorf("chmod failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := exec.Command("mkswap", SwapFile).Run(); err != nil {
		log.Errorf("formatting failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := exec.Command("swapon", SwapFile).Run(); err != nil {
		log.Errorf("enable swap partition failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	fstabEntry := fmt.Sprintf("\nsi11::sysinit:/sbin/swapon %s", SwapFile)
	f, err := os.OpenFile(InittabPath, os.O_APPEND|os.O_WRONLY, 0644)

	if err != nil {
		log.Errorf("read fstab failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	defer f.Close()

	_, err = f.WriteString(fstabEntry)
	if err != nil {
		log.Errorf("write fstab failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("Swap enabled")
}

func (s *Service) DisableSwap(c *gin.Context) {
	var rsp proto.Response

	input, err := os.ReadFile(InittabPath)
	if err != nil {
		log.Errorf("read fstab failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	lines := strings.Split(string(input), "\n")
	output := make([]string, 0)
	for _, line := range lines {
		if !strings.Contains(line, SwapFile) {
			output = append(output, line)
		}
	}

	content := strings.Join(output, "\n")
	content = strings.TrimSuffix(content, "\n")
	if err := os.WriteFile(TempInittab, []byte(content), 0644); err != nil {
		log.Errorf("write temp fstab failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := os.Rename(TempInittab, InittabPath); err != nil {
		log.Errorf("replace fstab failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := exec.Command("swapoff", "-a").Run(); err != nil {
		log.Errorf("close swap partition failed: %s", err)
		rsp.ErrRsp(c, -1, "operation failed")
		return
	}

	if err := os.Remove(SwapFile); err != nil && !os.IsNotExist(err) {
		log.Warnf("delete swap file failed: %s (ignored)", err)
	}

	rsp.OkRsp(c)
	log.Debugf("Swap disabled")
}

func isSwapEnabled() bool {
	_, err := os.Stat(SwapFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return false
		}
	}

	return true
}

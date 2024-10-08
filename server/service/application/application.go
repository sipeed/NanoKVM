package application

import (
	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

func (s *Service) GetVersion(c *gin.Context) {
	var rsp proto.Response

	// current version
	currentVersion := "1.0.0"
	content, err := os.ReadFile(VersionFile)
	if err == nil {
		currentVersion = strings.ReplaceAll(string(content), "\n", "")
	}

	// latest version
	url := fmt.Sprintf("%s?now=%d", VersionURL, time.Now().Unix())
	resp, err := http.Get(url)
	if err != nil {
		rsp.ErrRsp(c, -2, "Unable to access sipeed.com. Please check your network.")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		rsp.ErrRsp(c, -3, "get version failed")
		return
	}

	body, err := io.ReadAll(resp.Body)
	latestVersion := strings.Replace(string(body), "\n", "", -1)

	rsp.OkRspWithData(c, &proto.GetVersionRsp{
		Current: currentVersion,
		Latest:  latestVersion,
	})
}

func (s *Service) Update(c *gin.Context) {
	var rsp proto.Response

	if err := updateApp(); err != nil {
		rsp.ErrRsp(c, -1, "update failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("update application success")

	_ = exec.Command("sh", "-c", "/etc/init.d/S95nanokvm restart").Run()
}

func updateApp() error {
	cleanCmd := exec.Command("sh", "-c", fmt.Sprintf("rm -rf %s", Temporary))
	_ = cleanCmd.Run()
	_ = os.MkdirAll(Temporary, 0755)
	defer cleanCmd.Run()

	if err := downloadLib(); err != nil {
		return err
	}

	if err := downloadApp(); err != nil {
		return err
	}

	commands := []string{
		fmt.Sprintf("mv -f %s/%s %s/latest/kvm_system/dl_lib/", Temporary, LibName, Temporary), // move lib
		fmt.Sprintf("rm -rf %s && mv %s %s", Backup, Workspace, Backup),                        // backup old version
		fmt.Sprintf("rm -rf %s && mv %s/latest %s", Workspace, Temporary, Workspace),           // update
		fmt.Sprintf("chmod -R 755 %s", Workspace),                                              // modify permission
	}

	for _, command := range commands {
		err := exec.Command("sh", "-c", command).Run()
		if err != nil {
			return err
		}
	}

	return nil
}

func downloadApp() error {
	url := fmt.Sprintf("%s?now=%d", ApplicationURL, time.Now().Unix())
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Errorf("new request err: %s", err)
		return err
	}

	zipFile := fmt.Sprintf("%s/latest.zip", Temporary)
	err = utils.Download(req, zipFile)
	if err != nil {
		return err
	}

	command := fmt.Sprintf("unzip %s -d %s", zipFile, Temporary)
	err = exec.Command("sh", "-c", command).Run()
	if err != nil {
		log.Errorf("unzip app failed: %s", err)
		return err
	}

	return nil
}

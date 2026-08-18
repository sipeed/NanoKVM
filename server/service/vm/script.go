package vm

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/proto"
	"NanoKVM-Server/utils"
)

const ScriptDirectory = "/etc/kvm/scripts"

func (s *Service) GetScripts(c *gin.Context) {
	var rsp proto.Response

	var files []string
	err := filepath.Walk(ScriptDirectory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && isScript(info.Name()) {
			files = append(files, info.Name())
		}

		return nil
	})
	if err != nil {
		rsp.ErrRsp(c, -1, "get scripts failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetScriptsRsp{
		Files: files,
	})

	log.Debugf("get scripts total %d", len(files))
}

func (s *Service) UploadScript(c *gin.Context) {
	var rsp proto.Response

	_, header, err := c.Request.FormFile("file")
	if err != nil {
		rsp.ErrRsp(c, -1, "bad request")
		return
	}

	target, err := utils.SecureJoin(ScriptDirectory, header.Filename)
	if err != nil || !isScript(header.Filename) {
		rsp.ErrRsp(c, -2, "invalid arguments")
		return
	}

	if _, err = os.Stat(ScriptDirectory); err != nil {
		_ = os.MkdirAll(ScriptDirectory, 0o755)
	}

	err = c.SaveUploadedFile(header, target)
	if err != nil {
		rsp.ErrRsp(c, -2, "save failed")
		return
	}

	_ = utils.EnsurePermission(target, 0o100)

	data := &proto.UploadScriptRsp{
		File: header.Filename,
	}
	rsp.OkRspWithData(c, data)

	log.Debugf("upload script %s success", header.Filename)
}

func (s *Service) RunScript(c *gin.Context) {
	var req proto.RunScriptReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	// The name reaches a process argument, so it must be a plain file inside
	// the script directory - never a path, and never shell metacharacters.
	script, err := utils.SecureJoin(ScriptDirectory, req.Name)
	if err != nil || !isScript(req.Name) {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	var output []byte
	cmd := scriptCommand(req.Name, script)

	if req.Type == "foreground" {
		output, err = cmd.CombinedOutput()
	} else {
		cmd.Stdout = nil
		cmd.Stderr = nil
		go func() {
			err := cmd.Run()
			if err != nil {
				log.Errorf("run script %s in background failed: %s", req.Name, err)
			}
		}()
	}

	if err != nil {
		log.Errorf("run script %s failed: %s", req.Name, err.Error())
		rsp.ErrRsp(c, -2, "run script failed")
		return
	}

	rsp.OkRspWithData(c, &proto.RunScriptRsp{
		Log: string(output),
	})

	log.Debugf("run script %s success", req.Name)
}

func (s *Service) DeleteScript(c *gin.Context) {
	var req proto.DeleteScriptReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	file, err := utils.SecureJoin(ScriptDirectory, req.Name)
	if err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if err := os.Remove(file); err != nil {
		log.Errorf("delete script %s failed: %s", file, err)
		rsp.ErrRsp(c, -3, "delete failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete script %s success", file)
}

// scriptCommand builds the command that runs a script. The interpreter takes
// the path as an argument, so the name can no longer become shell text. A
// shell script still goes through sh, because "sh -c <path>" used to fall back
// to interpreting a file that has no shebang, and running the path directly
// would break those scripts with ENOEXEC.
func scriptCommand(name string, path string) *exec.Cmd {
	if strings.HasSuffix(strings.ToLower(name), ".py") {
		return exec.Command("python", path)
	}

	return exec.Command("sh", path)
}

func isScript(name string) bool {
	nameLower := strings.ToLower(name)
	if strings.HasSuffix(nameLower, ".sh") || strings.HasSuffix(nameLower, ".py") {
		return true
	}

	return false
}

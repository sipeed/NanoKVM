package router

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func Init(r *gin.Engine) {
	web(r)
	server(r)
	log.Debugf("router init done")
}

func web(r *gin.Engine) {
	execPath, err := os.Executable()
	if err != nil {
		panic("invalid executable path")
	}

	execDir := filepath.Dir(execPath)
	webPath := fmt.Sprintf("%s/web", execDir)

	r.Use(static.Serve("/", static.LocalFile(webPath, true)))
}

func server(r *gin.Engine) {
	authRouter(r)
	applicationRouter(r)
	vmRouter(r)
	vmAdminRouter(r)
	streamRouter(r)
	storageRouter(r)
	networkRouter(r)
	hidRouter(r)
	wsRouter(r)
	downloadRouter(r)
	extensionsRouter(r)
}

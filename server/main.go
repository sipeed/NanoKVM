package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"
	"NanoKVM-Server/service/auth"
	"NanoKVM-Server/service/vm/jiggler"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func main() {
	initialize()
	defer dispose()

	run()
}

func initialize() {
	logger.Init()

	auth.CheckAccountsFile()

	// init screen parameters
	_ = common.GetScreen()

	// init HDMI
	vision := common.GetKvmVision()
	vision.SetHDMI(false)
	time.Sleep(10 * time.Millisecond)
	vision.SetHDMI(true)

	// run mouse jiggler
	jiggler.GetJiggler().Run()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		sig := <-sigChan
		log.Printf("\nReceived signal: %v\n", sig)

		dispose()
		os.Exit(0)
	}()
}

func run() {
	conf := config.GetInstance()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	if conf.Authentication == "disable" {
		r.Use(cors.AllowAll())
	}

	router.Init(r)

	httpAddr := fmt.Sprintf(":%d", conf.Port.Http)
	httpsAddr := fmt.Sprintf(":%d", conf.Port.Https)

	if conf.Proto == "https" {
		go func() {
			r.Use(middleware.Tls())
			err := r.RunTLS(httpsAddr, conf.Cert.Crt, conf.Cert.Key)
			if err != nil {
				panic("start https server failed")
			}
		}()

		runRedirect(httpAddr, httpsAddr)
	} else {
		if err := r.Run(httpAddr); err != nil {
			panic("start http server failed")
		}
	}
}

func runRedirect(httpPort string, httpsPort string) {
	err := http.ListenAndServe(httpPort, http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		host := req.Host
		if strings.Contains(host, httpPort) {
			host = strings.Split(host, httpPort)[0]
		}

		targetURL := "https://" + host + req.URL.String()
		if httpsPort != ":443" {
			targetURL = "https://" + host + httpsPort + req.URL.String()
		}

		http.Redirect(w, req, targetURL, http.StatusTemporaryRedirect)
	}))

	if err != nil {
		panic("start http server failed")
	}
}

func dispose() {
	common.GetKvmVision().Close()
}

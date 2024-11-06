package main

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func main() {
	initialize()
	defer dispose()
	signalHandler()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.AllowAll())

	router.Init(r)

	run(r)
}

func initialize() {
	logger.Init()
	_ = common.GetScreen()
	_ = common.GetKvmVision()
}

func run(r *gin.Engine) {
	conf := config.GetInstance()

	httpAddr := fmt.Sprintf(":%d", conf.Port.Http)
	httpsAddr := fmt.Sprintf(":%d", conf.Port.Https)

	if conf.Protocol == "https" {
		r.Use(middleware.Tls())

		go func() {
			if err := r.Run(httpAddr); err != nil {
				panic("start http server failed")
			}
		}()

		if err := r.RunTLS(httpsAddr, conf.Cert.Crt, conf.Cert.Key); err != nil {
			panic("start https server failed")
		}
	} else {
		if err := r.Run(httpAddr); err != nil {
			panic("start http server failed")
		}
	}
}

func dispose() {
	common.GetKvmVision().Close()
}

func signalHandler() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)

	go func() {
		sig := <-sigChan
		fmt.Printf("\nReceived signal: %v\n", sig)

		dispose()
		os.Exit(0)
	}()
}

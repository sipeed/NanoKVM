package main

import (
	"NanoKVM-Server/common"
	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"
	"NanoKVM-Server/utils"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

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

	// init screen parameters
	_ = common.GetScreen()

	// init HDMI
	vision := common.GetKvmVision()
	vision.SetHDMI(false)
	time.Sleep(10 * time.Millisecond)
	vision.SetHDMI(true)

	utils.InitGoMemLimit()

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
	log.Printf("proto: %s, port: %d %d\n", conf.Proto, conf.Port.Http, conf.Port.Https)

	if conf.Proto == "https" {
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

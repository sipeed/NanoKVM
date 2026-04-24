package main

import (
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"NanoKVM-Server/common"
	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"
	"NanoKVM-Server/service/vm/jiggler"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func main() {
	initialize()
	defer dispose()

	run()
}

func initialize() {
	if err := config.EnsurePicoclawInternalToken(); err != nil {
		log.Fatalf("failed to initialize picoclaw internal token: %v", err)
	}

	logger.Init()

	// init screen parameters
	_ = common.GetScreen()

	// init HDMI
	vision := common.GetKvmVision()
	vision.SetHDMI(false)
	time.Sleep(10 * time.Millisecond)
	if !utils.IsHdmiDisabled() {
		vision.SetHDMI(true)
	}

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

	httpAddr := utils.ListenAddr(conf.Host, strconv.Itoa(conf.Port.Http))
	loopbackHTTPAddr := utils.ListenAddr("127.0.0.1", strconv.Itoa(conf.Port.Http))
	needsLoopbackHTTP := utils.NeedsDedicatedLoopbackListener(conf.Host)

	if conf.Proto == "https" {
		httpsPortStr := strconv.Itoa(conf.Port.Https)

		go func() {
			err := r.RunTLS(utils.ListenAddr(conf.Host, httpsPortStr), conf.Cert.Crt, conf.Cert.Key)
			if err != nil {
				panic("start https server failed")
			}
		}()

		if needsLoopbackHTTP {
			go func() {
				if err := middleware.ListenAndServeLoopbackHTTPRedirect(
					loopbackHTTPAddr,
					httpsPortStr,
					r,
					router.LoopbackHTTPAllowedPaths()...,
				); err != nil {
					panic("start loopback http server failed")
				}
			}()
		}

		if err := middleware.ListenAndServeLoopbackHTTPRedirect(
			httpAddr,
			httpsPortStr,
			r,
			router.LoopbackHTTPAllowedPaths()...,
		); err != nil {
			panic("start http server failed")
		}
	} else {
		if needsLoopbackHTTP {
			go func() {
				if err := r.Run(loopbackHTTPAddr); err != nil {
					panic("start loopback http server failed")
				}
			}()
		}

		if err := r.Run(httpAddr); err != nil {
			panic("start http server failed")
		}
	}
}

func dispose() {
	common.GetKvmVision().Close()
}

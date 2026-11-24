package main

import (
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"NanoKVM-Server/common"
	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"
	"NanoKVM-Server/service/storage/diskfs"
	"NanoKVM-Server/service/vm"
	"NanoKVM-Server/service/vm/jiggler"
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func main() {
	// The 2.4.3 init script starts both daemons concurrently. kvm_system
	// owns migration; the new init script starts us after the required boot.
	for _, marker := range []string{"/kvmapp/kvm_new_app", "/run/nanokvm-hardware-reboot"} {
		if _, err := os.Stat(marker); !os.IsNotExist(err) {
			log.Printf("waiting for application migration before starting the server (%s)", marker)
			return
		}
	}
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

	// Apply the saved state once; starting the server must not pulse reset.
	var hdmiErr error
	if utils.IsHdmiDisabled() {
		hdmiErr = vm.DisableHdmiCapture()
	} else {
		hdmiErr = vm.EnableHdmiCapture()
	}
	if hdmiErr != nil {
		log.Printf("failed to apply HDMI power preference: %v", hdmiErr)
	}
	vm.SetHdmiViewerCount(0)

	// run mouse jiggler
	jiggler.GetJiggler().Run()

	// A medium left mounted by a crash or a restart keeps its loop device
	// busy; nothing can be mounted by this process yet, so whatever is there
	// is stale.
	diskfs.CleanupStale()

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
	diskfs.CleanupStale()
	common.GetKvmVision().Close()
}

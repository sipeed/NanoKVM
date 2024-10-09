package main

import (
	"fmt"

	"NanoKVM-Server/config"
	"NanoKVM-Server/logger"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/router"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func main() {
	logger.Init()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.AllowAll())

	router.Init(r)

	run(r)
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

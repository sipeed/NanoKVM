package logger

import (
	"NanoKVM-Server/config"
	"github.com/sirupsen/logrus"
	"os"
)

func Init() {
	conf := config.GetInstance()

	level, err := logrus.ParseLevel(conf.Log)
	if err != nil {
		level = logrus.ErrorLevel
	}

	logrus.SetLevel(level)
	logrus.SetOutput(os.Stdout)

	logrus.SetReportCaller(true)
	logrus.SetFormatter(&formatter{})

	logrus.Info("logger set success")
}

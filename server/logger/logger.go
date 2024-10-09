package logger

import (
	"os"
	"path/filepath"

	"NanoKVM-Server/config"

	"github.com/sirupsen/logrus"
)

func openLogFile(filename string) (*os.File, error) {
	absPath, err := filepath.Abs(filename)
	if err != nil {
		return nil, err
	}

	file, err := os.OpenFile(absPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return nil, err
	}

	return file, nil
}

func Init() {
	conf := config.GetInstance()

	level, err := logrus.ParseLevel(conf.Logger.Level)
	if err != nil {
		level = logrus.ErrorLevel
	}

	logrus.SetLevel(level)
	if conf.Logger.File == "" || conf.Logger.File == "stdout" {
		logrus.SetOutput(os.Stdout)
	} else {
		fh, err := openLogFile(conf.Logger.File)
		if err != nil {
			logrus.Error("open log file failed:", err)
			logrus.SetOutput(os.Stdout)
		} else {
			logrus.SetOutput(fh)
		}
	}

	logrus.SetReportCaller(true)
	logrus.SetFormatter(&formatter{})

	logrus.Info("logger set success")
}

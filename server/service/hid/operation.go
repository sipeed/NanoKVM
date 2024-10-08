package hid

import (
	"errors"
	log "github.com/sirupsen/logrus"
	"os"
)

var (
	Hidg0 *os.File
	Hidg1 *os.File
	Hidg2 *os.File
)

func Open() {
	Close()

	var err error

	Hidg0, err = os.OpenFile("/dev/hidg0", os.O_WRONLY, 0666)
	if err != nil {
		log.Errorf("open /dev/hidg0 failed: %s", err)
	}

	Hidg1, err = os.OpenFile("/dev/hidg1", os.O_WRONLY, 0666)
	if err != nil {
		log.Errorf("open /dev/hidg1 failed: %s", err)
	}

	Hidg2, err = os.OpenFile("/dev/hidg2", os.O_WRONLY, 0666)
	if err != nil {
		log.Errorf("open /dev/hidg2 failed: %s", err)
	}
}

func Close() {
	for _, file := range []*os.File{Hidg0, Hidg1, Hidg2} {
		if file != nil {
			_ = file.Sync()
			_ = file.Close()
		}
	}
}

func Write(file *os.File, data []byte) {
	_, err := file.Write(data)
	if err != nil {
		if errors.Is(err, os.ErrClosed) {
			Open()
			log.Debugf("hid already closed, reopen it...")
		} else {
			log.Errorf("write to hid failed: %s", err)
		}

		return
	}

	log.Debugf("write to hid: %+v", data)
}

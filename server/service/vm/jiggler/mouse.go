package jiggler

import (
	"os"
	"time"

	log "github.com/sirupsen/logrus"
)

func move(mode string) {
	var (
		hid  string
		data [][]byte
	)

	if mode == "absolute" {
		hid = "/dev/hidg2"
		data = [][]byte{
			{0x00, 0x00, 0x3f, 0x00, 0x3f, 0x00},
			{0x00, 0xff, 0x3f, 0xff, 0x3f, 0x00},
		}
	} else {
		hid = "/dev/hidg1"
		data = [][]byte{
			{0x00, 0x0a, 0x0a, 0x00},
			{0x00, 0xf6, 0xf6, 0x00},
		}
	}

	write(hid, data)
}

func write(hid string, data [][]byte) {
	file, err := os.OpenFile(hid, os.O_WRONLY, 0o666)
	if err != nil {
		log.Errorf("failed to open %s: %s", hid, err)
		return
	}
	defer func() {
		_ = file.Close()
	}()

	for _, b := range data {
		deadline := time.Now().Add(8 * time.Millisecond)
		if err := file.SetWriteDeadline(deadline); err != nil {
			log.Errorf("failed to set deadline: %s", err)
			return
		}

		if _, err := file.Write(b); err != nil {
			log.Errorf("failed to write: %s", err)
			return
		}
	}
}

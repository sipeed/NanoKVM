package hid

import (
	"os"
	"sync"
)

var (
	hid     *Hid
	hidOnce sync.Once
)

type Hid struct {
	g0         *os.File
	g1         *os.File
	g2         *os.File
	kbMutex    sync.Mutex
	mouseMutex sync.Mutex
}

func (h *Hid) Lock() {
	h.kbMutex.Lock()
	h.mouseMutex.Lock()
}

func (h *Hid) Unlock() {
	h.kbMutex.Unlock()
	h.mouseMutex.Unlock()
}

func GetHid() *Hid {
	hidOnce.Do(func() {
		hid = &Hid{}
	})
	return hid
}

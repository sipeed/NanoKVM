package jiggler

import (
	"NanoKVM-Server/service/hid"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	ConfigFile = "/etc/kvm/mouse-jiggler"
	Interval   = 15 * time.Second
)

var (
	jiggler Jiggler
	once    sync.Once
)

type Jiggler struct {
	mutex       sync.Mutex
	enabled     bool
	running     bool
	mode        string
	lastUpdated time.Time
}

func GetJiggler() *Jiggler {
	once.Do(func() {
		jiggler = Jiggler{
			mutex:       sync.Mutex{},
			enabled:     false,
			running:     false,
			mode:        "relative",
			lastUpdated: time.Now(),
		}

		content, err := os.ReadFile(ConfigFile)
		if err != nil {
			return
		}

		mode := strings.ReplaceAll(string(content), "\n", "")
		if mode != "" {
			jiggler.mode = mode
		}

		jiggler.enabled = true
	})

	return &jiggler
}

func (j *Jiggler) Enable(mode string) error {
	err := os.WriteFile(ConfigFile, []byte(mode), 0644)
	if err != nil {
		return err
	}

	j.enabled = true
	j.mode = mode
	j.Run()

	return nil
}

func (j *Jiggler) Disable() error {
	if err := os.Remove(ConfigFile); err != nil {
		return err
	}

	j.enabled = false
	j.mode = "relative"

	return nil
}

func (j *Jiggler) Run() {
	if !j.enabled || j.running {
		return
	}

	j.mutex.Lock()
	j.running = true
	j.mutex.Unlock()

	j.Update()

	go func() {
		ticker := time.NewTicker(Interval)
		defer ticker.Stop()

		for range ticker.C {
			if !j.enabled {
				j.running = false
				return
			}

			if time.Since(j.lastUpdated) > Interval {
				move(j.mode)
				j.Update()
			}
		}
	}()
}

func (j *Jiggler) Update() {
	if j.running {
		j.lastUpdated = time.Now()
	}
}

func (j *Jiggler) IsEnabled() bool {
	return j.enabled
}

func (j *Jiggler) GetMode() string {
	return j.mode
}

func move(mode string) {
	h := hid.GetHid()

	if mode == "absolute" {
		h.WriteHid2([]byte{0x00, 0x00, 0x3f, 0x00, 0x3f, 0x00})
		time.Sleep(100 * time.Millisecond)
		h.WriteHid2([]byte{0x00, 0xff, 0x3f, 0xff, 0x3f, 0x00})
	} else {
		h.WriteHid1([]byte{0x00, 0xa, 0xa, 0x00})
		time.Sleep(100 * time.Millisecond)
		h.WriteHid1([]byte{0x00, 0xf6, 0xf6, 0x00})
	}
}

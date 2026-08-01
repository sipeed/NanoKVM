//go:build novision

package common

import (
	"sync"

	log "github.com/sirupsen/logrus"
)

// This stub replaces the cgo capture bindings when the "novision" build tag is
// set. The real implementation links against libkvm in dl_lib through cgo, so
// building it needs CGO_ENABLED=1 and the riscv64 cross-compiler. Without this
// stub, every package that reaches common is therefore out of reach of go vet
// and go test on a workstation. It is never used in a device build.

var (
	kvmVision     *KvmVision
	kvmVisionOnce sync.Once
)

type KvmVision struct{}

func GetKvmVision() *KvmVision {
	kvmVisionOnce.Do(func() {
		kvmVision = &KvmVision{}
		log.Debugf("kvm vision stub initialized")
	})

	return kvmVision
}

func (k *KvmVision) ReadMjpeg(width uint16, height uint16, quality uint16) (data []byte, result int) {
	return nil, -1
}

func (k *KvmVision) ReadH264(width uint16, height uint16, bitRate uint16) (data []byte, result int) {
	return nil, -1
}

func (k *KvmVision) SetHDMI(enable bool) int {
	return 0
}

// HasHDMISignal reports no signal, which is what the real binding also returns
// when the library is closed. A caller that polls it therefore sees a valid
// state rather than a build without an input.
func (k *KvmVision) HasHDMISignal() bool {
	return false
}

func (k *KvmVision) SetGop(gop uint8) {}

func (k *KvmVision) SetFrameDetect(frame uint8) {}

func (k *KvmVision) Close() {}

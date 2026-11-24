package common

/*
	#cgo CFLAGS: -I../include
	#cgo !kvm_staged LDFLAGS: -L${SRCDIR}/../dl_lib
	#cgo kvm_staged LDFLAGS: -L${SRCDIR}/../../kvmapp/server/dl_lib -Wl,-rpath-link,${SRCDIR}/../../kvmapp/server/dl_lib
	#cgo LDFLAGS: -lkvm
	#include "kvm_vision.h"
*/
import "C"
import (
	"fmt"
	"os"
	"sync"
	"syscall"
	"unsafe"

	log "github.com/sirupsen/logrus"
)

var (
	kvmVision     *KvmVision
	kvmVisionOnce sync.Once
)

type KvmVision struct {
	mutex  sync.RWMutex
	closed bool
}

func GetKvmVision() *KvmVision {
	kvmVisionOnce.Do(func() {
		kvmVision = &KvmVision{}

		logLevel := C.uint8_t(0)
		C.kvmv_init(logLevel)
		log.Debugf("kvm vision initialized")
	})

	return kvmVision
}

func (k *KvmVision) ReadMjpeg(width uint16, height uint16, quality uint16) ([]byte, int) {
	frame := k.AcquireMjpeg(width, height, quality, uint16(GetScreen().FPS))
	defer frame.Release()
	return frame.Data, frame.Result
}

func (k *KvmVision) AcquireMjpeg(width, height, quality, fps uint16) *VideoFrame {
	return k.acquireFrame(width, height, quality, fps, 0)
}

func (k *KvmVision) AcquireH264(width, height, bitRate, fps uint16) *VideoFrame {
	return k.acquireFrame(width, height, bitRate, fps, 1)
}

func (k *KvmVision) acquireFrame(width, height, quality, fps uint16, codec uint8) *VideoFrame {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if k.closed {
		return NewVideoFrame(nil, -1, 0, nil)
	}
	var frame C.kvmv_frame_t
	result := int(C.kvmv_read_img(C.uint16_t(width), C.uint16_t(height),
		C.uint8_t(codec), C.uint16_t(quality), C.uint16_t(fps), &frame))
	if frame.data == nil {
		return NewVideoFrame(nil, result, int64(frame.timestamp), nil)
	}
	data := C.GoBytes(unsafe.Pointer(frame.data), C.int(frame.size))
	return NewVideoFrame(data, result, int64(frame.timestamp), func() {
		k.mutex.RLock()
		defer k.mutex.RUnlock()
		C.kvmv_release_frame(&frame)
	})
}

func (k *KvmVision) StopH264()  { k.stopStream(1) }
func (k *KvmVision) StopMjpeg() { k.stopStream(0) }

func (k *KvmVision) stopStream(codec uint8) {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if !k.closed {
		C.kvmv_stop_stream(C.uint8_t(codec))
	}
}

func (k *KvmVision) SetHDMI(enable bool) error {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if k.closed {
		return os.ErrClosed
	}

	hdmiEnable := C.uint8_t(0)
	if enable {
		hdmiEnable = C.uint8_t(1)
	}

	result := int(C.kvmv_hdmi_control(hdmiEnable))
	if result < 0 {
		return fmt.Errorf("set HDMI power to %t: %w", enable, syscall.Errno(-result))
	}

	return nil
}

// CaptureState reports SDK configuration separately from physical HDMI signal.
// Sequence identifies the kernel snapshot processed by the capture monitor.
func (k *KvmVision) CaptureState() (result int, sequence uint64, err error) {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if k.closed {
		return 0, 0, os.ErrClosed
	}

	var seq C.uint64_t
	result = int(C.kvmv_capture_state(&seq))
	return result, uint64(seq), nil
}

func (k *KvmVision) SetGop(gop uint8) {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if k.closed {
		return
	}

	_gop := C.uint8_t(gop)
	C.set_h264_gop(_gop)
}

func (k *KvmVision) SetFrameDetect(frame uint8) {
	k.mutex.RLock()
	defer k.mutex.RUnlock()
	if k.closed {
		return
	}

	_frame := C.uint8_t(frame)
	C.set_frame_detact(_frame)
}

func (k *KvmVision) Close() {
	k.mutex.Lock()
	defer k.mutex.Unlock()
	if k.closed {
		return
	}

	k.closed = true
	C.kvmv_deinit()
	log.Debugf("stop kvm vision...")
}

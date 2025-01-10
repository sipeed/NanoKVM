package common

/*
	#cgo CFLAGS: -I../include
	#cgo LDFLAGS: -L../dl_lib -lkvm
	#include "kvm_vision.h"
*/
import "C"
import (
	"NanoKVM-Server/config"
	"strings"
	"sync"
	"unsafe"

	log "github.com/sirupsen/logrus"
)

var (
	kvmVision     *KvmVision
	kvmVisionOnce sync.Once
)

type KvmVision struct {
	mutex sync.Mutex
}

func GetKvmVision() *KvmVision {
	kvmVisionOnce.Do(func() {
		kvmVision = &KvmVision{}

		conf := config.GetInstance()
		logLevel := strings.ToLower(conf.Logger.Level)

		logEnable := C.uint8_t(0)
		if logLevel == "debug" {
			logEnable = C.uint8_t(1)
		}

		C.kvmv_init(logEnable)
		log.Debugf("kvm vision initialized")
	})

	return kvmVision
}

func (k *KvmVision) ReadMjpeg(width uint16, height uint16, quality uint16) (data []byte, result int) {
	k.mutex.Lock()
	defer k.mutex.Unlock()

	var (
		kvmData  *C.uint8_t
		dataSize C.uint32_t
	)

	result = int(C.kvmv_read_img(
		C.uint16_t(width),
		C.uint16_t(height),
		C.uint8_t(0),
		C.uint16_t(quality),
		&kvmData,
		&dataSize,
	))
	if result < 0 {
		log.Errorf("failed to read kvm image: %v", result)
		return
	}
	defer C.free_kvmv_data(&kvmData)

	data = C.GoBytes(unsafe.Pointer(kvmData), C.int(dataSize))

	log.Debugf("read kvm image: %v", result)
	return
}

func (k *KvmVision) ReadH264(width uint16, height uint16, bitRate uint16) (data []byte, sps []byte, pps []byte, result int) {
	k.mutex.Lock()
	defer k.mutex.Unlock()

	var (
		kvmData  *C.uint8_t
		dataSize C.uint32_t
	)

	result = int(C.kvmv_read_img(
		C.uint16_t(width),
		C.uint16_t(height),
		C.uint8_t(1),
		C.uint16_t(bitRate),
		&kvmData,
		&dataSize,
	))
	if result < 0 {
		log.Errorf("failed to read kvm image: %v", result)
		return
	}
	defer C.free_kvmv_data(&kvmData)

	data = C.GoBytes(unsafe.Pointer(kvmData), C.int(dataSize))

	if result == 3 {
		sps, _ = k.ReadH264SPS()
		pps, _ = k.ReadH264PPS()
	}

	log.Debugf("read kvm image: %v", result)
	return
}

func (k *KvmVision) ReadH264SPS() ([]byte, int) {
	var (
		kvmData  *C.uint8_t
		dataSize C.uint32_t
	)

	result := int(C.kvmv_get_sps_frame(&kvmData, &dataSize))
	if result < 0 {
		log.Errorf("failed to read sps: %v", result)
		return nil, result
	}

	data := C.GoBytes(unsafe.Pointer(kvmData), C.int(dataSize))

	return data, result
}

func (k *KvmVision) ReadH264PPS() ([]byte, int) {
	var (
		kvmData  *C.uint8_t
		dataSize C.uint32_t
	)

	result := int(C.kvmv_get_pps_frame(&kvmData, &dataSize))
	if result < 0 {
		log.Errorf("failed to read pps: %v", result)
		return nil, result
	}

	data := C.GoBytes(unsafe.Pointer(kvmData), C.int(dataSize))
	return data, result
}

func (k *KvmVision) Close() {
	k.mutex.Lock()
	defer k.mutex.Unlock()

	C.kvmv_deinit()
	log.Debugf("stop kvm vision...")
}

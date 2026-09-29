//go:build teststub

package common

// KvmVision is a no-hardware implementation used by architecture-independent
// unit tests. Production builds compile kvm_vision.go and use the real C ABI.
type KvmVision struct{}

var testKvmVision = &KvmVision{}

func GetKvmVision() *KvmVision {
	return testKvmVision
}

func (k *KvmVision) ReadMjpeg(uint16, uint16, uint16) ([]byte, int) {
	return nil, -1
}

func (k *KvmVision) ReadH264(uint16, uint16, uint16) ([]byte, int) {
	return nil, -1
}

func (k *KvmVision) ReadVideo(uint16, uint16, uint8, uint16, uint8, uint8) ([]byte, int) {
	return nil, -1
}

func (k *KvmVision) ReadVideoWithHeadroom(uint16, uint16, uint8, uint16, uint8, uint8, int) ([]byte, []byte, int) {
	return nil, nil, -1
}

func (k *KvmVision) SetHDMI(bool) int {
	return 0
}

func (k *KvmVision) HasHDMISignal() bool {
	return false
}

func (k *KvmVision) SetGop(uint8) {}

func (k *KvmVision) SetFrameDetect(uint8) {}

func (k *KvmVision) Close() {}

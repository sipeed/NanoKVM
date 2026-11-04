package common

import "sync"

type VideoFrame struct {
	Data      []byte
	Result    int
	Timestamp int64
	release   func()
	once      sync.Once
}

func NewVideoFrame(data []byte, result int, timestamp int64, release func()) *VideoFrame {
	return &VideoFrame{Data: data, Result: result, Timestamp: timestamp, release: release}
}

func (f *VideoFrame) Release() {
	if f == nil {
		return
	}
	f.once.Do(func() {
		if f.release != nil {
			f.release()
		}
	})
}

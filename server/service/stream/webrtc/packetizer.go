package webrtc

import (
	"github.com/pion/rtp"
	"github.com/pion/rtp/codecs"
)

type h264Packetizer struct {
	packetizer  rtp.Packetizer
	lastTicks   uint64
	initialized bool
}

func newH264Packetizer() *h264Packetizer {
	return &h264Packetizer{
		packetizer: rtp.NewPacketizer(1200, 100, 0x1234ABCD,
			&codecs.H264Payloader{}, rtp.NewRandomSequencer(), 90000),
	}
}

func (p *h264Packetizer) Packetize(data []byte, timestamp int64) []*rtp.Packet {
	if len(data) == 0 {
		return nil
	}

	ticks := uint64(timestamp) * 90 / 1000
	if p.initialized {
		p.packetizer.SkipSamples(uint32(ticks - p.lastTicks))
	}
	p.lastTicks = ticks
	p.initialized = true
	return p.packetizer.Packetize(data, 0)
}

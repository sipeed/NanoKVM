package webrtc

import (
	"github.com/pion/rtp"
)

func (t *Track) writeVideoPackets(packets []*rtp.Packet) error {
	for _, packet := range packets {
		if err := t.video.WriteRTP(packet); err != nil {
			return err
		}
	}

	return nil
}

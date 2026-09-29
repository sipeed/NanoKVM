package webrtc

import (
	"NanoKVM-Server/service/stream"
	"strings"
	"testing"

	pion "github.com/pion/webrtc/v4"
)

func TestMediaEngineOffersOnlySelectedVideoCodec(t *testing.T) {
	tests := []struct {
		name       string
		codec      stream.VideoCodec
		wantRTPMap string
		reject     string
	}{
		{name: "H264", codec: stream.VideoCodecH264, wantRTPMap: "H264/90000", reject: "H265/90000"},
		{name: "H265", codec: stream.VideoCodecH265, wantRTPMap: "H265/90000", reject: "H264/90000"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := stream.DefaultEncoderConfig()
			config.Codec = test.codec
			engine, err := createMediaEngine(config)
			if err != nil {
				t.Fatal(err)
			}
			peer, err := createPeerConnection(nil, engine)
			if err != nil {
				t.Fatal(err)
			}
			defer peer.Close()

			if _, err := peer.AddTransceiverFromKind(pion.RTPCodecTypeVideo, pion.RTPTransceiverInit{
				Direction: pion.RTPTransceiverDirectionRecvonly,
			}); err != nil {
				t.Fatal(err)
			}
			offer, err := peer.CreateOffer(nil)
			if err != nil {
				t.Fatal(err)
			}
			if !strings.Contains(offer.SDP, test.wantRTPMap) {
				t.Fatalf("offer does not advertise %s:\n%s", test.wantRTPMap, offer.SDP)
			}
			if strings.Contains(offer.SDP, test.reject) {
				t.Fatalf("offer unexpectedly advertises %s:\n%s", test.reject, offer.SDP)
			}
		})
	}
}

func TestVideoPacketizersAcceptAnnexB(t *testing.T) {
	tests := []struct {
		name    string
		codec   stream.VideoCodec
		annexB  []byte
		nalType func([]byte) byte
		wantNAL byte
	}{
		{
			name:    "H264 IDR",
			codec:   stream.VideoCodecH264,
			annexB:  []byte{0, 0, 0, 1, 0x65, 1, 2, 3},
			nalType: func(payload []byte) byte { return payload[0] & 0x1f },
			wantNAL: 5,
		},
		{
			name:    "H265 IDR",
			codec:   stream.VideoCodecH265,
			annexB:  []byte{0, 0, 0, 1, 19 << 1, 1, 1, 2, 3},
			nalType: func(payload []byte) byte { return (payload[0] >> 1) & 0x3f },
			wantNAL: 19,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			packets := newVideoPacketizer(test.codec).Packetize(test.annexB, 3000)
			if len(packets) != 1 || len(packets[0].Payload) == 0 {
				t.Fatalf("Packetize() produced %d packet(s)", len(packets))
			}
			if got := test.nalType(packets[0].Payload); got != test.wantNAL {
				t.Fatalf("NAL type = %d, want %d", got, test.wantNAL)
			}
		})
	}
}

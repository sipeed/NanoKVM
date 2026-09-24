package stream

import (
	"fmt"
	"net/url"
)

type VideoCodec string

const (
	VideoCodecH264 VideoCodec = "h264"
	VideoCodecH265 VideoCodec = "h265"
)

type EncoderConfig struct {
	Codec VideoCodec
}

func (c VideoCodec) NativeCodec() int {
	if c == VideoCodecH265 {
		return 2
	}
	return 1
}

func DefaultEncoderConfig() EncoderConfig {
	return EncoderConfig{Codec: VideoCodecH265}
}

func LegacyEncoderConfig() EncoderConfig {
	return EncoderConfig{Codec: VideoCodecH264}
}

func ParseEncoderConfig(values url.Values, fallback EncoderConfig) (EncoderConfig, error) {
	config := fallback

	if value := values.Get("codec"); value != "" {
		config.Codec = VideoCodec(value)
	}
	if config.Codec != VideoCodecH264 && config.Codec != VideoCodecH265 {
		return EncoderConfig{}, fmt.Errorf("invalid codec %q: expected h264 or h265", config.Codec)
	}

	// Keep accepting an explicit CBR marker for early development clients, but
	// reject every other mode. Bitrate and GOP remain the device-wide Screen
	// settings controlled by the existing Quality and GOP menu items.
	if value := values.Get("rc"); value != "" && value != "cbr" {
		return EncoderConfig{}, fmt.Errorf("invalid rate control %q: only cbr is supported", value)
	}

	return config, nil
}

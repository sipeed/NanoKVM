package stream

import (
	"net/url"
	"strings"
	"testing"
)

func TestEncoderConfigDefaults(t *testing.T) {
	if got := DefaultEncoderConfig(); got.Codec != VideoCodecH265 {
		t.Fatalf("default codec = %q, want h265", got.Codec)
	}
	if got := LegacyEncoderConfig(); got.Codec != VideoCodecH264 {
		t.Fatalf("legacy codec = %q, want h264", got.Codec)
	}
}

func TestParseEncoderConfig(t *testing.T) {
	tests := []struct {
		name     string
		query    string
		fallback EncoderConfig
		want     EncoderConfig
	}{
		{
			name:     "default h265",
			fallback: DefaultEncoderConfig(),
			want:     EncoderConfig{Codec: VideoCodecH265},
		},
		{
			name:     "h264",
			query:    "codec=h264",
			fallback: DefaultEncoderConfig(),
			want:     EncoderConfig{Codec: VideoCodecH264},
		},
		{
			name:     "explicit cbr compatibility marker",
			query:    "codec=h265&rc=cbr",
			fallback: LegacyEncoderConfig(),
			want:     EncoderConfig{Codec: VideoCodecH265},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			values, err := url.ParseQuery(test.query)
			if err != nil {
				t.Fatal(err)
			}
			got, err := ParseEncoderConfig(values, test.fallback)
			if err != nil {
				t.Fatalf("ParseEncoderConfig() error = %v", err)
			}
			if got != test.want {
				t.Fatalf("ParseEncoderConfig() = %+v, want %+v", got, test.want)
			}
		})
	}
}

func TestParseEncoderConfigRejectsUnsupportedValues(t *testing.T) {
	tests := []struct {
		query   string
		message string
	}{
		{query: "codec=vp9", message: "invalid codec"},
		{query: "rc=avbr", message: "only cbr is supported"},
		{query: "rc=vbr", message: "only cbr is supported"},
	}

	for _, test := range tests {
		t.Run(test.query, func(t *testing.T) {
			values, err := url.ParseQuery(test.query)
			if err != nil {
				t.Fatal(err)
			}
			_, err = ParseEncoderConfig(values, DefaultEncoderConfig())
			if err == nil || !strings.Contains(err.Error(), test.message) {
				t.Fatalf("ParseEncoderConfig() error = %v, want message containing %q", err, test.message)
			}
		})
	}
}

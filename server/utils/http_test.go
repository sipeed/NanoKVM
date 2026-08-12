package utils

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return fn(request)
}

func testDownloadClient(body, contentType string) *http.Client {
	return &http.Client{Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode:    http.StatusOK,
			Header:        http.Header{"Content-Type": []string{contentType}},
			Body:          io.NopCloser(strings.NewReader(body)),
			ContentLength: int64(len(body)),
			Request:       request,
		}, nil
	})}
}

func TestDownloadPreflightRunsBeforeTargetCreation(t *testing.T) {
	oldClient := downloadClient
	downloadClient = testDownloadClient("package", "application/x-compressed; charset=binary")
	defer func() { downloadClient = oldClient }()

	target := filepath.Join(t.TempDir(), "package.tar.gz")
	req, err := http.NewRequest(http.MethodGet, "https://updates.example/package", nil)
	if err != nil {
		t.Fatal(err)
	}
	_, err = Download(req, target, 1024, func(int64) error { return errors.New("no space") })
	if err == nil {
		t.Fatal("download succeeded despite failed preflight")
	}
	if _, statErr := os.Stat(target); !os.IsNotExist(statErr) {
		t.Fatalf("target was created before preflight: %v", statErr)
	}
}

func TestDownloadRemovesPartialFileAndReportsWrittenBytes(t *testing.T) {
	oldClient := downloadClient
	downloadClient = testDownloadClient("12345", "application/gzip")
	defer func() { downloadClient = oldClient }()

	request := func() *http.Request {
		req, err := http.NewRequest(http.MethodGet, "https://updates.example/package", nil)
		if err != nil {
			t.Fatal(err)
		}
		return req
	}
	target := filepath.Join(t.TempDir(), "package.tar.gz")
	if _, err := Download(request(), target, 4, nil); err == nil {
		t.Fatal("oversized download was accepted")
	}
	if _, err := os.Stat(target); !os.IsNotExist(err) {
		t.Fatalf("partial file remains: %v", err)
	}
	info, err := Download(request(), target, 5, nil)
	if err != nil {
		t.Fatal(err)
	}
	if info.Written != 5 {
		t.Fatalf("written = %d, want 5", info.Written)
	}
}

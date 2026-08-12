package utils

import (
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

var downloadClient = NewUpdateHTTPClient(15 * time.Minute)

type DownloadInfo struct {
	ContentLength int64
	Written       int64
}

func NewAuthenticatedRequest(method string, rawURL string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequest(method, rawURL, body)
	if err != nil {
		return nil, err
	}

	if req.URL.User != nil {
		username := req.URL.User.Username()
		password, _ := req.URL.User.Password()
		req.SetBasicAuth(username, password)
		// Keep credentials out of the request URL after copying them to the header.
		req.URL.User = nil
	}

	return req, nil
}

func NewUpdateHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout:       timeout,
		CheckRedirect: preserveBasicAuthRedirect,
	}
}

func preserveBasicAuthRedirect(req *http.Request, via []*http.Request) error {
	if len(via) == 0 {
		return nil
	}

	previous := via[len(via)-1]
	authorization := previous.Header.Get("Authorization")
	if authorization == "" {
		return nil
	}

	if !sameUpdateHost(previous.URL, req.URL) ||
		(previous.URL.Scheme == "https" && req.URL.Scheme != "https") {
		return http.ErrUseLastResponse
	}

	req.Header.Set("Authorization", authorization)
	return nil
}

func sameUpdateHost(left *url.URL, right *url.URL) bool {
	return strings.EqualFold(left.Host, right.Host)
}

func Download(req *http.Request, target string, maxBytes int64, beforeWrite func(contentLength int64) error) (DownloadInfo, error) {
	log.Debugf("downloading %s to %s", req.URL.Redacted(), target)
	resp, err := downloadClient.Do(req)
	if err != nil {
		log.Errorf("request to %s failed", req.URL.Redacted())
		return DownloadInfo{}, errors.New("update website is inaccessible right now")
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		log.Errorf("request failed, status code: %d", resp.StatusCode)
		return DownloadInfo{}, errors.New("update website is inaccessible right now")
	}
	contentType, _, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if err != nil || !allowedDownloadContentType(contentType) {
		log.Debugf("unexpected content-type: %s", resp.Header.Get("Content-Type"))
		return DownloadInfo{}, errors.New("unsupported content type")
	}
	if resp.ContentLength > maxBytes {
		return DownloadInfo{}, fmt.Errorf("download exceeds %d bytes", maxBytes)
	}
	if resp.ContentLength > 0 && beforeWrite != nil {
		if err := beforeWrite(resp.ContentLength); err != nil {
			return DownloadInfo{}, err
		}
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		log.Errorf("create dir %s err: %s", filepath.Dir(target), err)
		return DownloadInfo{}, err
	}
	out, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		log.Errorf("cannot create file '%s', error: %s", target, err)
		return DownloadInfo{}, err
	}
	success := false
	defer func() {
		_ = out.Close()
		if !success {
			_ = os.Remove(target)
		}
	}()
	written, err := io.Copy(out, io.LimitReader(resp.Body, maxBytes+1))
	if err != nil {
		log.Errorf("download file to %s err: %s", target, err)
		return DownloadInfo{}, err
	}
	if written > maxBytes {
		return DownloadInfo{}, fmt.Errorf("download exceeds %d bytes", maxBytes)
	}
	if err := out.Close(); err != nil {
		return DownloadInfo{}, err
	}
	success = true
	return DownloadInfo{ContentLength: resp.ContentLength, Written: written}, nil
}

func allowedDownloadContentType(contentType string) bool {
	switch contentType {
	case "application/octet-stream", "application/gzip", "application/x-gzip", "application/x-compressed", "application/zip":
		return true
	default:
		return false
	}
}

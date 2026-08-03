package application

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Latest struct {
	Version string `json:"version"`
	Name    string `json:"name"`
	Sha512  string `json:"sha512"`
	Size    uint64 `json:"size"`
	Url     string `json:"-"`
}

const (
	maxLatestJSONSize = 64 * 1024
)

var (
	latestClient       = &http.Client{Timeout: 15 * time.Second}
	packageNamePattern = regexp.MustCompile(`^nanokvm_[0-9]+\.[0-9]+\.[0-9]+\.tar\.gz$`)
	versionPattern     = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)
)

func (s *Service) GetVersion(c *gin.Context) {
	var rsp proto.Response

	// current version
	currentVersion := "1.0.0"

	versionFile := fmt.Sprintf("%s/version", AppDir)
	if version, err := os.ReadFile(versionFile); err == nil {
		currentVersion = strings.ReplaceAll(string(version), "\n", "")
	}

	log.Debugf("current version: %s", currentVersion)

	// latest version
	latestVersion := ""
	latest, err := getLatest()
	if err != nil {
		log.Errorf("failed to get latest version: %s", err)
		rsp.ErrRsp(c, -1, "failed to query latest version")
		return
	}
	latestVersion = latest.Version

	rsp.OkRspWithData(c, &proto.GetVersionRsp{
		Current: currentVersion,
		Latest:  latestVersion,
	})
}

func getLatest() (*Latest, error) {
	baseURL, err := resolveUpdateBaseURL()
	if err != nil {
		return nil, err
	}

	manifestURL, err := joinUpdateURL(baseURL, "latest.json")
	if err != nil {
		return nil, err
	}
	parsedManifestURL, err := url.Parse(manifestURL)
	if err != nil {
		return nil, err
	}
	query := parsedManifestURL.Query()
	query.Set("now", fmt.Sprintf("%d", time.Now().Unix()))
	parsedManifestURL.RawQuery = query.Encode()

	resp, err := latestClient.Get(parsedManifestURL.String())
	if err != nil {
		log.Debugf("failed to request version from %s", parsedManifestURL.Redacted())
		return nil, errors.New("update server is inaccessible")
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxLatestJSONSize+1))
	if err != nil {
		log.Errorf("failed to read response: %v", err)
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		log.Errorf("server responded with status code: %d", resp.StatusCode)
		return nil, fmt.Errorf("status code %d", resp.StatusCode)
	}
	if len(body) > maxLatestJSONSize {
		return nil, fmt.Errorf("latest manifest exceeds %d bytes", maxLatestJSONSize)
	}

	var latest Latest
	if err := json.Unmarshal(body, &latest); err != nil {
		log.Errorf("failed to unmarshal response: %s", err)
		return nil, err
	}
	if err := validateLatest(&latest); err != nil {
		return nil, err
	}

	latest.Url, err = joinUpdateURL(baseURL, latest.Name)
	if err != nil {
		return nil, err
	}

	log.Debugf("get application latest version: %s", latest.Version)
	return &latest, nil
}

func joinUpdateURL(baseURL string, element string) (string, error) {
	joined, err := url.JoinPath(baseURL, element)
	if err != nil {
		return "", fmt.Errorf("join update URL: %w", err)
	}
	return joined, nil
}

func validateLatest(latest *Latest) error {
	if !versionPattern.MatchString(latest.Version) {
		return errors.New("invalid latest version")
	}
	if !packageNamePattern.MatchString(latest.Name) {
		return errors.New("invalid update package name")
	}
	digest, err := base64.StdEncoding.DecodeString(latest.Sha512)
	if err != nil || len(digest) != 64 {
		return errors.New("invalid update package sha512")
	}
	if latest.Size == 0 {
		return errors.New("invalid update package size")
	}
	return nil
}

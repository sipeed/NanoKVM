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
	"NanoKVM-Server/utils"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type Latest struct {
	ManifestVersion   int    `json:"manifest_version,omitempty"`
	Version           string `json:"version"`
	Name              string `json:"name"`
	Sha512            string `json:"sha512"`
	LegacySize        uint64 `json:"size"`
	SizeBytes         uint64 `json:"size_bytes,omitempty"`
	UnpackedSizeBytes uint64 `json:"unpacked_size_bytes,omitempty"`
	Url               string `json:"-"`
}

const (
	maxLatestJSONSize = 64 * 1024
)

var (
	latestClient       = utils.NewUpdateHTTPClient(15 * time.Second)
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

	request, err := utils.NewAuthenticatedRequest("GET", parsedManifestURL.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := latestClient.Do(request)
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
	if latest.LegacySize == 0 {
		return errors.New("invalid update package size")
	}
	switch latest.ManifestVersion {
	case 0, 1:
		return nil
	case 2:
		if latest.SizeBytes == 0 || latest.SizeBytes > maxPackageSize {
			return errors.New("invalid update package size_bytes")
		}
		if latest.UnpackedSizeBytes == 0 || latest.UnpackedSizeBytes > maxExpandedSize {
			return errors.New("invalid update package unpacked_size_bytes")
		}
		return nil
	default:
		return errors.New("unsupported update manifest version")
	}
}

func preflightManifestSpace(path string, latest *Latest) error {
	if latest.ManifestVersion != 2 {
		return nil
	}
	return ensureFreeSpace(path, latest.SizeBytes)
}

func validateDownloadedSize(latest *Latest, written uint64) error {
	if written > maxPackageSize {
		return fmt.Errorf("update package exceeds %d bytes", maxPackageSize)
	}
	if latest.ManifestVersion == 2 && written != latest.SizeBytes {
		return fmt.Errorf("update package size mismatch: expected %d bytes, got %d", latest.SizeBytes, written)
	}
	return nil
}

func validateExpandedSize(latest *Latest, expanded uint64) error {
	if latest.ManifestVersion == 2 && expanded != latest.UnpackedSizeBytes {
		return fmt.Errorf("update package expanded size mismatch: expected %d bytes, got %d", latest.UnpackedSizeBytes, expanded)
	}
	return nil
}

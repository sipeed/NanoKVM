package ws

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	StreamState = "/kvmapp/kvm/state"
)

func watchStreamState(fileModMap map[string]time.Time) ([]byte, error) {
	content, lastModTime, err := readFile(StreamState, fileModMap[StreamState])
	fileModMap[StreamState] = lastModTime

	if err != nil {
		log.Errorf("read file %s failed: %s", StreamState, err)
		return nil, err
	}
	if content == nil {
		return nil, nil
	}

	contentStr := strings.ReplaceAll(string(content), "\n", "")
	state, err := strconv.Atoi(contentStr)
	if err != nil {
		log.Errorf("parse stream state failed: %s", err)
		return nil, err
	}

	message, err := json.Marshal(&Stream{
		Type:  "stream",
		State: state,
	})
	if err != nil {
		log.Errorf("parse stream failed: %s", err)
		return nil, err
	}

	return message, nil
}

func readFile(filename string, lastModTime time.Time) ([]byte, time.Time, error) {
	file, err := os.Stat(filename)
	if err != nil {
		return nil, lastModTime, err
	}

	if !file.ModTime().After(lastModTime) {
		return nil, lastModTime, nil
	}

	if lastModTime.Equal(time.Unix(0, 0)) {
		return nil, file.ModTime(), nil
	}

	content, err := os.ReadFile(filename)
	if err != nil {
		return nil, file.ModTime(), err
	}

	return content, file.ModTime(), nil
}

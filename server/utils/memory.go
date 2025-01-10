package utils

import (
	"fmt"
	"os"
	"runtime/debug"
	"strconv"
	"strings"

	log "github.com/sirupsen/logrus"
)

const GoMemLimitFile = "/etc/kvm/GOMEMLIMIT"

func InitGoMemLimit() {
	if !IsGoMemLimitExist() {
		return
	}

	limit, err := GetGoMemLimit()
	if err != nil {
		return
	}

	debug.SetMemoryLimit(limit * 1024 * 1024)
	log.Debugf("set GOMEMLIMIT to %d MB", limit)
}

func SetGoMemLimit(limit int64) error {
	memoryLimit := max(limit, 50)
	debug.SetMemoryLimit(memoryLimit * 1024 * 1024)

	log.Debugf("set GOMEMLIMIT to %d MB", limit)

	data := []byte(fmt.Sprintf("%d", limit))
	err := os.WriteFile(GoMemLimitFile, data, 0o644)
	if err != nil {
		log.Errorf("failed to write GOMEMLIMIT: %s", err)
		return err
	}

	return nil
}

func GetGoMemLimit() (int64, error) {
	data, err := os.ReadFile(GoMemLimitFile)
	if err != nil {
		log.Errorf("failed to read GOMEMLIMIT: %s", err)
		return 0, err
	}

	content := strings.TrimSpace(string(data))
	limit, err := strconv.ParseInt(content, 10, 64)
	if err != nil {
		log.Errorf("failed to parse GOMEMLIMIT: %s", err)
		return 0, err
	}

	return limit, nil
}

func DelGoMemLimit() error {
	debug.SetMemoryLimit(1024 * 1024 * 1024)

	err := os.Remove(GoMemLimitFile)
	if err != nil {
		log.Errorf("failed to delete GOMEMLIMIT: %s", err)
		return err
	}

	return nil
}

func IsGoMemLimitExist() bool {
	_, err := os.Stat(GoMemLimitFile)
	return err == nil
}

package logger

import (
	"bytes"
	"fmt"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

type formatter struct{}

func (f *formatter) Format(entry *logrus.Entry) ([]byte, error) {
	var (
		text   string
		buffer *bytes.Buffer
	)

	if entry.Buffer != nil {
		buffer = entry.Buffer
	} else {
		buffer = &bytes.Buffer{}
	}

	now := entry.Time.Format("2006-01-02 15:04:05.000")

	if entry.HasCaller() {
		fileName := filepath.Base(entry.Caller.File)
		text = fmt.Sprintf(
			"[%s] [%s] [%s:%d] %s\n",
			now, entry.Level, fileName, entry.Caller.Line, entry.Message,
		)
	} else {
		text = fmt.Sprintf(
			"[%s] [%s] %s \n",
			now, entry.Level, entry.Message,
		)
	}

	buffer.WriteString(text)
	return buffer.Bytes(), nil
}

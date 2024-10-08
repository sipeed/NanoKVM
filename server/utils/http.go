package utils

import (
	"errors"
	log "github.com/sirupsen/logrus"
	"io"
	"net/http"
	"os"
)

func Download(req *http.Request, target string) error {
	out, err := os.OpenFile(target, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		log.Errorf("create file %s err: %s", target, err)
		return err
	}
	defer out.Close()

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		log.Errorf("download file err: %s", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("request error")
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType != "application/octet-stream" && contentType != "application/zip" {
		return errors.New("download error")
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		log.Errorf("download file to %s err: %s", target, err)
		return err
	}

	return nil
}

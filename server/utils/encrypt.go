package utils

import (
	"net/url"

	"github.com/mervick/aes-everywhere/go/aes256"
	log "github.com/sirupsen/logrus"
)

const EncryptSecretKey = "nanokvm-sipeed-2024"

func Decrypt(ciphertext string) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			log.Errorf("decrypt failed: %s", err)
		}
	}()

	if ciphertext == "" {
		return "", nil
	}

	decrypt := aes256.Decrypt(ciphertext, EncryptSecretKey)

	return decrypt, nil
}

func DecodeDecrypt(ciphertext string) (string, error) {
	decode, err := url.QueryUnescape(ciphertext)
	if err != nil {
		log.Errorf("decode ciphertext failed: %s", err)
		return "", err
	}

	return Decrypt(decode)
}

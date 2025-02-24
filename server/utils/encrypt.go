package utils

import (
	"net/url"

	"github.com/mervick/aes-everywhere/go/aes256"
	log "github.com/sirupsen/logrus"
)

// SecretKey is only used to prevent the data from being transmitted in plaintext.
const SecretKey = "nanokvm-sipeed-2024"

func Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	decrypt := aes256.Decrypt(ciphertext, SecretKey)
	return decrypt, nil
}

func DecodeDecrypt(data string) (string, error) {
	ciphertext, err := url.QueryUnescape(data)
	if err != nil {
		log.Errorf("decode ciphertext failed: %s", err)
		return "", err
	}

	return Decrypt(ciphertext)
}

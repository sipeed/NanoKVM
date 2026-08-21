package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"encoding/base64"
	"errors"
	"net/url"
)

// SecretKey is only used to prevent the data from being transmitted in plaintext.
const SecretKey = "nanokvm-sipeed-2024"

var errInvalidCiphertext = errors.New("invalid encrypted password")

// Decrypt decodes the CryptoJS/OpenSSL salted AES-256-CBC format. Validate the
// complete ciphertext before using CBC so malformed input cannot panic.
func Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	raw, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil || len(raw) < 32 || string(raw[:8]) != "Salted__" {
		return "", errInvalidCiphertext
	}

	encrypted := raw[16:]
	if len(encrypted) == 0 || len(encrypted)%aes.BlockSize != 0 {
		return "", errInvalidCiphertext
	}

	key, iv := deriveKeyAndIV(SecretKey, raw[8:16])
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", errInvalidCiphertext
	}
	plain := make([]byte, len(encrypted))
	cipher.NewCBCDecrypter(block, iv).CryptBlocks(plain, encrypted)
	padding := int(plain[len(plain)-1])
	if padding < 1 || padding > aes.BlockSize || padding > len(plain) {
		return "", errInvalidCiphertext
	}
	for _, value := range plain[len(plain)-padding:] {
		if int(value) != padding {
			return "", errInvalidCiphertext
		}
	}
	return string(plain[:len(plain)-padding]), nil
}

func deriveKeyAndIV(passphrase string, salt []byte) ([]byte, []byte) {
	derived := make([]byte, 0, 48)
	previous := []byte(nil)
	for len(derived) < 48 {
		hash := md5.New()
		hash.Write(previous)
		hash.Write([]byte(passphrase))
		hash.Write(salt)
		previous = hash.Sum(nil)
		derived = append(derived, previous...)
	}
	return derived[:32], derived[32:48]
}

// DecodeDecrypt accepts both API representations. JSON clients send the legacy
// percent-encoded CryptoJS value; form parsing (including curl --data-urlencode)
// has already decoded it and therefore supplies raw Base64. Trying raw first
// prevents a Base64 '+' from becoming a space during a second URL decode.
func DecodeDecrypt(data string) (string, error) {
	plaintext, rawErr := Decrypt(data)
	if rawErr == nil {
		return plaintext, nil
	}

	ciphertext, err := url.QueryUnescape(data)
	if err != nil {
		return "", errInvalidCiphertext
	}
	if ciphertext == data {
		return "", rawErr
	}
	return Decrypt(ciphertext)
}

package utils

import (
	"net/url"
	"testing"
)

const opensslCiphertextWithPlus = "U2FsdGVkX18zLUxaLNGy7jL96oMO4tq6wDYwVzUMO3XfTY2Zy/ipO4LDEqtBT+fx"

func TestDecryptOpenSSLCompatibleCiphertext(t *testing.T) {
	// Generated with the command documented in server/README.md:
	// printf %s 'operator-password' | openssl enc -aes-256-cbc -salt -a -A \
	//   -md md5 -pass pass:nanokvm-sipeed-2024
	const ciphertext = "U2FsdGVkX18Bro2hr9XXYb1s/uS3XZhJ35fomLZqteJEFLM1biX4wIZFOslfOsWm"

	plaintext, err := Decrypt(ciphertext)
	if err != nil {
		t.Fatal(err)
	}
	if plaintext != "operator-password" {
		t.Fatalf("plaintext = %q, want %q", plaintext, "operator-password")
	}
}

func TestDecodeDecryptAcceptsRawAndEscapedCiphertext(t *testing.T) {
	tests := []struct {
		name string
		data string
	}{
		{name: "raw OpenSSL Base64", data: opensslCiphertextWithPlus},
		{name: "legacy URL-escaped JSON value", data: url.QueryEscape(opensslCiphertextWithPlus)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			plaintext, err := DecodeDecrypt(tt.data)
			if err != nil {
				t.Fatal(err)
			}
			if plaintext != "operator-password" {
				t.Fatalf("plaintext = %q, want operator-password", plaintext)
			}
		})
	}
}

func TestDecodeDecryptAfterFormParsing(t *testing.T) {
	encoded := url.Values{"password": {opensslCiphertextWithPlus}}.Encode()
	form, err := url.ParseQuery(encoded)
	if err != nil {
		t.Fatal(err)
	}
	plaintext, err := DecodeDecrypt(form.Get("password"))
	if err != nil {
		t.Fatal(err)
	}
	if plaintext != "operator-password" {
		t.Fatalf("plaintext = %q, want operator-password", plaintext)
	}
}

func TestDecryptRejectsMalformedCiphertextWithoutPanic(t *testing.T) {
	for _, ciphertext := range []string{
		"not base64!", "U2FsdGVkX18=", "U2FsdGVkX18AAAAAAAAAAA==",
		"U2FsdGVkX18AAAAAAAAAAAAAAAAAAAAA", "%zz",
	} {
		t.Run(ciphertext, func(t *testing.T) {
			defer func() {
				if recovered := recover(); recovered != nil {
					t.Fatalf("Decrypt panicked: %v", recovered)
				}
			}()
			if _, err := DecodeDecrypt(ciphertext); err == nil {
				t.Fatal("DecodeDecrypt accepted malformed ciphertext")
			}
		})
	}
}

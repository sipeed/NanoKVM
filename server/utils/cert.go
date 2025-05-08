package utils

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net"
	"os"
	"time"

	log "github.com/sirupsen/logrus"
)

func GenerateCert() error {
	var (
		host      = "localhost"
		ipAddress = []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")}
		validFor  = time.Hour * 24 * 365 * 10
		certFile  = "/etc/kvm/server.crt"
		keyFile   = "/etc/kvm/server.key"
	)

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Errorf("failed to generate RSA private key: %v", err)
		return err
	}
	publicKey := &privateKey.PublicKey

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		log.Errorf("failed to generate serial number: %v", err)
		return err
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			CommonName: host,
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(validFor),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IsCA:                  false,
		DNSNames:              []string{host},
		IPAddresses:           ipAddress,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, publicKey, privateKey)
	if err != nil {
		log.Errorf("failed to create certificate: %v", err)
		return err
	}

	// generate certificate
	certOut, err := os.Create(certFile)
	if err != nil {
		log.Errorf("failed to create %s: %v", certFile, err)
		return err
	}

	if err := pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		log.Errorf("failed to encode %s: %v", certFile, err)
		return err
	}

	_ = certOut.Sync()
	_ = certOut.Close()
	log.Debugf("%s generated", certFile)

	// generate private key
	keyOut, err := os.OpenFile(keyFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600) // 权限 0600
	if err != nil {
		log.Errorf("failed to create %s: %v", keyFile, err)
		return err
	}

	privateBytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		log.Errorf("failed to marshal private key: %v", err)
		return err
	}

	if err := pem.Encode(keyOut, &pem.Block{Type: "PRIVATE KEY", Bytes: privateBytes}); err != nil {
		log.Errorf("failed to encode %s: %v", keyFile, err)
		return err
	}

	_ = keyOut.Sync()
	_ = keyOut.Close()
	log.Debugf("%s generated", keyFile)

	return nil
}

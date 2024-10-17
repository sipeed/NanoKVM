package config

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

var (
	config Config
	once   sync.Once

	defaultConfig = &Config{
		Protocol: "http",
		Port: Port{
			Http:  80,
			Https: 443,
		},
		Cert: Cert{
			Crt: "server.crt",
			Key: "server.key",
		},
		Logger: Logger{
			Level: "info",
			File:  "stdout",
		},
		Authentication: "enable",
	}
)

func GetInstance() *Config {
	once.Do(initialize)

	return &config
}

func initialize() {
	if err := readByFile(); err != nil {
		if errors.As(err, &viper.ConfigFileNotFoundError{}) {
			create()
		}

		if err = readByDefault(); err != nil {
			log.Fatalf("Failed to read default configuration!")
		}

		log.Println("using default configuration")
	}

	if err := validate(); err != nil {
		log.Fatalf("Failed to validate configuration!")
	}

	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Failed to parse configuration: %s", err)
	}

	if config.Authentication == "disable" {
		log.Println("NOTICE: Authentication is disabled! Please ensure your service is secure!")
	}

	if config.SecretKey == "" {
		config.SecretKey = generateRandomString()
	}

	config.Hardware = getHardware()

	log.Println("config loaded successfully")
}

func readByFile() error {
	viper.SetConfigName("server")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/etc/kvm/")

	return viper.ReadInConfig()
}

func readByDefault() error {
	data, err := yaml.Marshal(defaultConfig)
	if err != nil {
		log.Printf("failed to marshal default config: %s", err)
		return err
	}

	return viper.ReadConfig(bytes.NewBuffer(data))
}

// Create configuration file.
func create() {
	var (
		file *os.File
		data []byte
		err  error
	)

	_ = os.MkdirAll("/etc/kvm", 0o644)

	file, err = os.OpenFile("/etc/kvm/server.yaml", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o644)
	if err != nil {
		log.Printf("open config failed: %s", err)
		return
	}
	defer func() {
		_ = file.Close()
	}()

	if data, err = yaml.Marshal(defaultConfig); err != nil {
		log.Printf("failed to marshal default config: %s", err)
		return
	}

	if _, err = file.Write(data); err != nil {
		log.Printf("failed to save config: %s", err)
		return
	}

	if err = file.Sync(); err != nil {
		log.Printf("failed to sync config: %s", err)
		return
	}

	log.Println("create file /etc/kvm/server.yaml with default configuration")
}

// Validate the configuration. This is to ensure compatibility with earlier versions.
func validate() error {
	if viper.GetInt("port.http") > 0 && viper.GetInt("port.https") > 0 {
		return nil
	}

	_ = os.Remove("/etc/kvm/server.yaml")
	log.Println("delete empty configuration file")

	create()

	return readByDefault()
}

// Generate random string for secret key.
func generateRandomString() string {
	b := make([]byte, 64)
	_, err := rand.Read(b)
	if err != nil {
		currentTime := time.Now().UnixNano()
		timeString := fmt.Sprintf("%d", currentTime)
		return fmt.Sprintf("%064s", timeString)
	}

	return base64.URLEncoding.EncodeToString(b)
}

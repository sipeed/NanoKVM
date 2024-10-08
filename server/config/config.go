package config

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/spf13/viper"
	"os"
	"sync"
	"time"
)

var (
	config Config
	once   sync.Once
)

var defaultConfig = []byte(`proto: http
port:
  http: 80 
  https: 443
cert:
  crt: server.crt
  key: server.key
`)

func GetInstance() *Config {
	once.Do(read)

	return &config
}

func read() {
	viper.SetConfigName("server")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/etc/kvm/")

	if err := viper.ReadInConfig(); err != nil {
		if errors.As(err, &viper.ConfigFileNotFoundError{}) {
			create()
			fmt.Printf("File /etc/kvm/server.yaml not exists. Use default configuration.\n")
		} else {
			fmt.Printf("Read file /etc/kvm/server.yaml failed. Use default configuration.\n")
		}
	}

	if err := viper.Unmarshal(&config); err != nil {
		panic(fmt.Sprintf("Can't read configuration file /etc/kvm/nanokvm.yaml.\n%s", err))
	}

	validate()

	if config.SecretKey == "" {
		config.SecretKey = generateRandomString()
	}

	if config.Authentication == "disable" {
		fmt.Println("NOTICE: Authentication is disabled! Please ensure your service is secure!")
	}

	fmt.Printf("load config success\n")
}

func create() {
	_ = os.MkdirAll("/etc/kvm", 0644)

	file, err := os.OpenFile("/etc/kvm/server.yaml", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		fmt.Printf("open config failed: %s\n", err)
		return
	}
	defer file.Close()

	_, err = file.Write(defaultConfig)
	if err != nil {
		fmt.Printf("save config failed: %s\n", err)
		return
	}

	err = file.Sync()
	if err != nil {
		fmt.Printf("sync config failed: %s\n", err)
		return
	}
}

func validate() {
	if config.Port.Http > 0 && config.Port.Https > 0 {
		return
	}

	_ = os.Remove("/etc/kvm/server.yaml")

	if err := viper.ReadConfig(bytes.NewBuffer(defaultConfig)); err != nil {
		panic("load default config failed")
	}

	if err := viper.Unmarshal(&config); err != nil {
		panic("Can't read configuration file /etc/kvm/server.yaml.")
	}
}

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

package config

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

const (
	hwVersionFile = "/etc/kvm/hw"

	gpioPower    = "/sys/class/gpio/gpio503/value"
	gpioPowerLED = "/sys/class/gpio/gpio504/value"

	gpioResetAlpha  = "/sys/class/gpio/gpio507/value"
	gpioHDDLedAlpha = "/sys/class/gpio/gpio505/value"

	gpioResetBeta = "/sys/class/gpio/gpio505/value"
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
		Logger: LoggerConfig{
			Level: "info",
			File:  "stdout",
		},
		Authentication: "enable",
		SecretKey:      generateRandomString(),
	}
)

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
			log.Println("File /etc/kvm/server.yaml not found. Create a new one with default configuration.")
		} else {
			log.Println("Failed to read config file /etc/kvm/server.yaml. Using default configuration.")
		}
	}

	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Failed to parse configuration file /etc/kvm/server.yaml: %s", err)
	}

	validate()

	if config.SecretKey == "" {
		config.SecretKey = defaultConfig.SecretKey
	}

	if config.Authentication == "disable" {
		log.Println("NOTICE: Authentication is disabled! Please ensure your service is secure!")
	}

	log.Println("config loaded successfully")
	config.HW.Version = getHwVersion()
	config.HW.GPIOPower = gpioPower
	config.HW.GPIOPowerLED = gpioPowerLED
	switch config.HW.Version {
	case HWVersionAlpha:
		config.HW.GPIOHDDLed = gpioHDDLedAlpha
		config.HW.GPIOReset = gpioResetAlpha
	case HWVersionBeta:
		config.HW.GPIOReset = gpioResetBeta
	default:
		log.Fatalf("Unsupported hardware version: %s", config.HW.Version)
	}
}

func create() {
	_ = os.MkdirAll("/etc/kvm", 0o644)

	file, err := os.OpenFile("/etc/kvm/server.yaml", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o644)
	if err != nil {
		log.Printf("open config failed: %s", err)
		return
	}
	defer func() {
		_ = file.Close()
	}()

	data, err := yaml.Marshal(defaultConfig)
	if err != nil {
		log.Printf("failed to marshal default config: %s", err)
		return
	}

	_, err = file.Write(data)
	if err != nil {
		log.Printf("failed to save config: %s", err)
		return
	}

	err = file.Sync()
	if err != nil {
		log.Printf("failed to sync config: %s", err)
		return
	}
}

func validate() {
	if config.Port.Http > 0 && config.Port.Https > 0 {
		return
	}

	_ = os.Remove("/etc/kvm/server.yaml")

	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Failed to read configuration file /etc/kvm/server.yaml: %v", err)
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

func getHwVersion() HWVersion {
	content, err := os.ReadFile(hwVersionFile)
	if err == nil {
		version := strings.ReplaceAll(string(content), "\n", "")
		if version == "beta" {
			return HWVersionBeta
		}
	}

	return HWVersionAlpha
}

package config

import (
	"bytes"
	"errors"
	"log"
	"os"
	"sync"
	"sync/atomic"

	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

var (
	instance                  Config
	once                      sync.Once
	terminalConfigMu          sync.Mutex
	maxTerminalSessions       atomic.Int64
	terminalSessionsUnlimited atomic.Bool
)

const (
	DefaultMaxTerminalSessions = 8
	MinTerminalSessions        = 1
	MaxTerminalSessions        = 64
)

func init() {
	maxTerminalSessions.Store(DefaultMaxTerminalSessions)
	terminalSessionsUnlimited.Store(false)
}

func GetInstance() *Config {
	once.Do(initialize)

	return &instance
}

func GetMaxTerminalSessions() int {
	return int(maxTerminalSessions.Load())
}

func IsTerminalSessionsUnlimited() bool {
	return terminalSessionsUnlimited.Load()
}

func SetTerminalSessionsConfig(value int, unlimited bool) error {
	if value < MinTerminalSessions || value > MaxTerminalSessions {
		return errors.New("maximum terminal sessions must be between 1 and 64")
	}

	terminalConfigMu.Lock()
	defer terminalConfigMu.Unlock()

	conf := *GetInstance()
	conf.Terminal.MaxSessions = value
	conf.Terminal.Unlimited = unlimited
	if err := Write(&conf); err != nil {
		return err
	}
	instance.Terminal.MaxSessions = value
	instance.Terminal.Unlimited = unlimited
	storeMaxTerminalSessions(value)
	terminalSessionsUnlimited.Store(unlimited)
	return nil
}

func storeMaxTerminalSessions(value int) {
	maxTerminalSessions.Store(int64(value))
}

func storeTerminalSessionsUnlimited(value bool) {
	terminalSessionsUnlimited.Store(value)
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

	if err := viper.Unmarshal(&instance); err != nil {
		log.Fatalf("Failed to parse configuration: %s", err)
	}

	checkDefaultValue()

	if instance.Authentication == "disable" {
		log.Println("NOTICE: Authentication is disabled! Please ensure your service is secure!")
	}

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

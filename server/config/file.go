package config

import (
	"os"

	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const ConfigurationFile = "/etc/kvm/server.yaml"

func Read() (*Config, error) {
	data, err := os.ReadFile(ConfigurationFile)
	if err != nil {
		log.Errorf("failed to read config: %v", err)
		return nil, err
	}

	var conf Config

	if err := yaml.Unmarshal(data, &conf); err != nil {
		log.Fatalf("failed to unmarshal config: %v", err)
		return nil, err
	}

	log.Debugf("read %s successfully", ConfigurationFile)
	return &conf, nil
}

func Write(conf *Config) error {
	data, err := yaml.Marshal(&conf)
	if err != nil {
		log.Errorf("failed to marshal config: %v", err)
		return err
	}

	err = os.WriteFile(ConfigurationFile, data, 0644)
	if err != nil {
		log.Errorf("failed to write config: %v", err)
		return err
	}

	log.Debugf("write to %s successfully", ConfigurationFile)
	return nil
}

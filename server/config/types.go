package config

type HWVersion int

const (
	HWVersionAlpha HWVersion = iota
	HWVersionBeta
)

func (h HWVersion) String() string {
	switch h {
	case HWVersionAlpha:
		return "Alpha"
	case HWVersionBeta:
		return "Beta"
	default:
		return "Unknown"
	}
}

type Config struct {
	Protocol       string       `yaml:"proto"`
	Port           Port         `yaml:"port"`
	Cert           Cert         `yaml:"cert"`
	Logger         LoggerConfig `yaml:"logger"`
	Authentication string       `yaml:"authentication"`
	SecretKey      string       `yaml:"secretKey"`

	HW HW `yaml:"-"`
}

type HW struct {
	Version      HWVersion `yaml:"-"`
	GPIOReset    string    `yaml:"-"`
	GPIOPower    string    `yaml:"-"`
	GPIOPowerLED string    `yaml:"-"`
	GPIOHDDLed   string    `yaml:"-"`
}

type LoggerConfig struct {
	Level string `yaml:"level"`
	File  string `yaml:"file"`
}

type Port struct {
	Http  int `yaml:"http"`
	Https int `yaml:"https"`
}

type Cert struct {
	Crt string `yaml:"crt"`
	Key string `yaml:"key"`
}

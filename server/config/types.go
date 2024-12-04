package config

type Config struct {
	Proto          string `yaml:"proto"`
	Port           Port   `yaml:"port"`
	Cert           Cert   `yaml:"cert"`
	Logger         Logger `yaml:"logger"`
	Authentication string `yaml:"authentication"`
	SecretKey      string `yaml:"secretKey"`

	Hardware Hardware `yaml:"-"`
}

type Logger struct {
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

type Hardware struct {
	Version      HWVersion `yaml:"-"`
	GPIOReset    string    `yaml:"-"`
	GPIOPower    string    `yaml:"-"`
	GPIOPowerLED string    `yaml:"-"`
	GPIOHDDLed   string    `yaml:"-"`
}

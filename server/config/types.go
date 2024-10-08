package config

type Config struct {
	Protocol       string `yaml:"proto"`
	Port           Port   `yaml:"port"`
	Cert           Cert   `yaml:"cert"`
	Log            string `yaml:"logger"`
	Authentication string `yaml:"authentication"`
	SecretKey      string `yaml:"secretKey"`
}

type Port struct {
	Http  int `yaml:"http"`
	Https int `yaml:"https"`
}

type Cert struct {
	Crt string `yaml:"crt"`
	Key string `yaml:"key"`
}

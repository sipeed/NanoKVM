package config

var defaultConfig = &Config{
	Proto: "http",
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
	Stun: "stun.l.google.com:19302",
	Turn: Turn{
		TurnAddr: "turn.cloudflare.com:3478",
		TurnUser: "",
		TurnCred: "",
	},
	Authentication: "enable",
}

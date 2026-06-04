package config

var defaultConfig = &Config{
	Proto: "http",
	Host:  "",
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
	JWT: JWT{
		SecretKey:            "",
		RefreshTokenDuration: 2678400,
		RevokeTokensOnLogout: true,
	},
	Stun: "stun.l.google.com:19302",
	Turn: Turn{
		TurnAddr: "",
		TurnUser: "",
		TurnCred: "",
	},
	Authentication: "enable",
	Security: Security{
		LoginLockoutDuration: 0,
		LoginMaxFailures:     5,
	},
	Audit: Audit{
		Enabled:   boolPtr(true),
		File:      "/etc/kvm/audit.log",
		MaxSizeMB: 10,
	},
}

func boolPtr(b bool) *bool { return &b }

func checkDefaultValue() {
	if instance.JWT.SecretKey == "" {
		instance.JWT.SecretKey = generateRandomSecretKey()
		instance.JWT.RevokeTokensOnLogout = true
	}

	if instance.JWT.RefreshTokenDuration == 0 {
		instance.JWT.RefreshTokenDuration = 2678400
	}

	if instance.Stun == "" {
		instance.Stun = "stun.l.google.com:19302"
	}

	if instance.Authentication == "" {
		instance.Authentication = "enable"
	}

	// Audit: default to enabled when the key is absent (existing installs whose
	// config predates this feature); honour an explicit `enabled: false`.
	if instance.Audit.Enabled == nil {
		instance.Audit.Enabled = boolPtr(true)
	}
	if instance.Audit.File == "" {
		instance.Audit.File = "/etc/kvm/audit.log"
	}
	if instance.Audit.MaxSizeMB == 0 {
		instance.Audit.MaxSizeMB = 10
	}

	instance.Hardware = getHardware()
}

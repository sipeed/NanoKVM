package picoclaw

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
)

const (
	defaultPicoclawPingSec  = 30
	defaultPicoclawReadSec  = 60
	defaultPicoclawWriteSec = 10
	defaultPicoclawMaxConns = 100
	defaultNanoKVMHTTPPort  = 80
)

type picoclawConfigRule func(*picoclawConfigPatcher)

type picoclawConfigPatcher struct {
	raw     map[string]any
	changed bool
}

func ensurePicoclawNanoKVMDefaults() error {
	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return err
	}

	patcher := &picoclawConfigPatcher{raw: doc.raw}
	for _, rule := range picoclawNanoKVMConfigRules() {
		rule(patcher)
	}

	tokenChanged, err := ensurePicoclawPicoToken(doc, patcher)
	if err != nil {
		return err
	}

	if patcher.changed {
		if err := doc.saveConfig(); err != nil {
			return err
		}
	}
	if tokenChanged {
		if err := doc.saveSecurity(); err != nil {
			return err
		}
	}

	return nil
}

func picoclawNanoKVMConfigRules() []picoclawConfigRule {
	return []picoclawConfigRule{
		func(p *picoclawConfigPatcher) {
			p.setBool(false, "agents", "defaults", "restrict_to_workspace")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "agents", "defaults", "allow_read_outside_workspace")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "agents", "defaults", "tool_feedback", "enabled")
		},
		func(p *picoclawConfigPatcher) {
			p.setString(defaultPicoclawGatewayHost, "gateway", "host")
		},
		func(p *picoclawConfigPatcher) {
			p.setInt(defaultPicoclawGatewayPort, "gateway", "port")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(false, "gateway", "hot_reload")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "tools", "cron", "allow_command")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "tools", "exec", "allow_remote")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(false, "tools", "exec", "enable_deny_patterns")
		},
		func(p *picoclawConfigPatcher) {
			p.setString("per-channel", "session", "dm_scope")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "channels", "pico", "enabled")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(false, "channels", "pico", "allow_token_query")
		},
		func(p *picoclawConfigPatcher) {
			p.setInt(defaultPicoclawPingSec, "channels", "pico", "ping_interval")
		},
		func(p *picoclawConfigPatcher) {
			p.setInt(defaultPicoclawReadSec, "channels", "pico", "read_timeout")
		},
		func(p *picoclawConfigPatcher) {
			p.setInt(defaultPicoclawWriteSec, "channels", "pico", "write_timeout")
		},
		func(p *picoclawConfigPatcher) {
			p.setInt(defaultPicoclawMaxConns, "channels", "pico", "max_connections")
		},
		func(p *picoclawConfigPatcher) {
			p.setBool(true, "tools", "mcp", "enabled")
		},
		func(p *picoclawConfigPatcher) {
			p.ensureMCPServer("nanokvm", map[string]any{
				"enabled": true,
				"type":    "http",
				"url":     fmt.Sprintf("http://%s:%d/api/picoclaw/mcp", defaultPicoclawGatewayHost, defaultNanoKVMHTTPPort),
			})
		},
	}
}

func (p *picoclawConfigPatcher) setString(value string, path ...string) {
	target := p.ensureObject(path[:len(path)-1]...)
	if setJSONString(target, path[len(path)-1], value) {
		p.changed = true
	}
}

func (p *picoclawConfigPatcher) setBool(value bool, path ...string) {
	target := p.ensureObject(path[:len(path)-1]...)
	if setJSONBool(target, path[len(path)-1], value) {
		p.changed = true
	}
}

func (p *picoclawConfigPatcher) setInt(value int, path ...string) {
	target := p.ensureObject(path[:len(path)-1]...)
	if setJSONInt(target, path[len(path)-1], value) {
		p.changed = true
	}
}

func (p *picoclawConfigPatcher) getString(path ...string) string {
	if len(path) == 0 {
		return ""
	}

	current := any(p.raw)
	for _, key := range path {
		object, ok := current.(map[string]any)
		if !ok {
			return ""
		}
		current = object[key]
	}

	return strings.TrimSpace(fmt.Sprintf("%v", current))
}

func (p *picoclawConfigPatcher) ensureObject(path ...string) map[string]any {
	current := p.raw
	for _, key := range path {
		next, ok := current[key].(map[string]any)
		if !ok {
			next = map[string]any{}
			current[key] = next
			p.changed = true
		}
		current = next
	}
	return current
}

func (p *picoclawConfigPatcher) ensureMCPServer(name string, fields map[string]any) {
	servers := p.ensureObject("tools", "mcp", "servers")
	entry, ok := servers[name].(map[string]any)
	if !ok {
		entry = map[string]any{}
		servers[name] = entry
		p.changed = true
	}
	for k, v := range fields {
		if entry[k] != v {
			entry[k] = v
			p.changed = true
		}
	}
}

func setJSONString(target map[string]any, key string, value string) bool {
	if strings.TrimSpace(fmt.Sprintf("%v", target[key])) == value {
		return false
	}
	target[key] = value
	return true
}

func setJSONBool(target map[string]any, key string, value bool) bool {
	if current, ok := target[key].(bool); ok && current == value {
		return false
	}
	target[key] = value
	return true
}

func setJSONInt(target map[string]any, key string, value int) bool {
	switch current := target[key].(type) {
	case float64:
		if int(current) == value {
			return false
		}
	case int:
		if current == value {
			return false
		}
	}
	target[key] = value
	return true
}

func generatePicoclawToken() (string, error) {
	buf := make([]byte, 24)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to generate picoclaw pico token: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

func ensurePicoclawPicoToken(doc *picoclawConfigDocument, patcher *picoclawConfigPatcher) (bool, error) {
	token := strings.TrimSpace(doc.resolvedPicoToken())
	if token == "" {
		var err error
		token, err = generatePicoclawToken()
		if err != nil {
			return false, err
		}
	}

	patcher.setString(token, "channels", "pico", "token")

	if doc.security.Channels.Pico == nil {
		doc.security.Channels.Pico = &picoclawPicoSecurity{}
	}
	if strings.TrimSpace(doc.security.Channels.Pico.Token) == token {
		return false, nil
	}

	doc.security.Channels.Pico.Token = token
	return true, nil
}

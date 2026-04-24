package utils

import (
	"fmt"
	"net"
	"strings"
)

func ListenAddr(host string, port string) string {
	if host == "" {
		return fmt.Sprintf(":%s", port)
	}
	return net.JoinHostPort(host, port)
}

func NeedsDedicatedLoopbackListener(host string) bool {
	host = strings.TrimSpace(strings.Trim(host, "[]"))
	if host == "" {
		return false
	}

	ip := net.ParseIP(host)
	if ip == nil {
		return !strings.EqualFold(host, "localhost")
	}

	return !ip.IsLoopback() && !ip.IsUnspecified()
}

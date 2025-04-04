package vm

import (
	"fmt"
	"net"
	"strings"

	log "github.com/sirupsen/logrus"
)

const (
	Wired    = "Wired"
	Wireless = "Wireless"
	Other    = "Other"
)

type InterfaceInfo struct {
	Name string
	Type string
	IP   net.IP
}

func GetInterfaceInfos() ([]*InterfaceInfo, error) {
	var interfaceInfos []*InterfaceInfo

	interfaces, err := net.Interfaces()
	if err != nil {
		log.Errorf("failed to get net interfaces: %s", err)
		return nil, err
	}

	for _, iface := range interfaces {
		info := getInterfaceInfo(iface)
		if info != nil {
			interfaceInfos = append(interfaceInfos, info)
		}
	}

	if len(interfaceInfos) == 0 {
		return nil, fmt.Errorf("no valid IP address")
	}

	return interfaceInfos, nil
}

func getInterfaceInfo(iface net.Interface) *InterfaceInfo {
	if iface.Flags&net.FlagUp == 0 {
		return nil
	}

	interfaceType := getInterfaceType(iface)
	if interfaceType == Other {
		return nil
	}

	interfaceIP := getInterfaceIP(iface)
	if interfaceIP == nil {
		return nil
	}

	return &InterfaceInfo{
		Name: iface.Name,
		Type: interfaceType,
		IP:   interfaceIP,
	}
}

func getInterfaceType(iface net.Interface) string {
	if strings.HasPrefix(iface.Name, "eth") || strings.HasPrefix(iface.Name, "en") {
		return Wired
	}

	if strings.HasPrefix(iface.Name, "wlan") || strings.HasPrefix(iface.Name, "wl") {
		return Wireless
	}

	return Other
}

func getInterfaceIP(iface net.Interface) net.IP {
	addrs, err := iface.Addrs()
	if err != nil {
		log.Errorf("failed to get interface addresses: %s", err)
		return nil
	}

	for _, addr := range addrs {
		var ip net.IP

		switch v := addr.(type) {
		case *net.IPNet:
			ip = v.IP
		case *net.IPAddr:
			ip = v.IP
		default:
			continue
		}

		if ip == nil {
			continue
		}

		return ip
	}

	return nil
}

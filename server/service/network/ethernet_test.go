package network

import (
	"os"
	"path/filepath"
	"testing"

	"NanoKVM-Server/proto"
)

func TestValidateStaticEthernet(t *testing.T) {
	prefix, gateway, err := validateStaticEthernet("192.168.10.32", 24, "192.168.10.1")
	if err != nil {
		t.Fatalf("expected valid configuration, got %v", err)
	}
	if prefix.String() != "192.168.10.32/24" || gateway.String() != "192.168.10.1" {
		t.Fatalf("unexpected normalized configuration: %s %s", prefix, gateway)
	}

	for _, test := range []struct {
		name, address, gateway string
		prefix                 int
	}{
		{"invalid address", "192.168.10.999", "192.168.10.1", 24},
		{"network address", "192.168.10.0", "192.168.10.1", 24},
		{"broadcast address", "192.168.10.255", "192.168.10.1", 24},
		{"invalid prefix", "192.168.10.32", "192.168.10.1", 31},
		{"different subnet gateway", "192.168.10.32", "192.168.11.1", 24},
		{"same address gateway", "192.168.10.32", "192.168.10.32", 24},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, _, err := validateStaticEthernet(test.address, test.prefix, test.gateway); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestEthernetConfigPersistence(t *testing.T) {
	tempDir := t.TempDir()
	originalFile := ethernetConfigFile
	ethernetConfigFile = filepath.Join(tempDir, "boot", "eth.nodhcp")
	t.Cleanup(func() { ethernetConfigFile = originalFile })

	static := proto.EthernetConfig{
		Mode:       ethernetModeStatic,
		Interface:  ethernetInterface,
		Address:    "10.0.0.20",
		SubnetMask: 24,
		Gateway:    "10.0.0.1",
	}
	if err := writeEthernetConfig(static); err != nil {
		t.Fatalf("write static config: %v", err)
	}

	got, err := readEthernetConfig()
	if err != nil {
		t.Fatalf("read static config: %v", err)
	}
	if got.Mode != ethernetModeStatic || got.Address != static.Address || got.Gateway != static.Gateway || got.SubnetMask != 24 {
		t.Fatalf("unexpected static config: %#v", got)
	}

	if err := writeEthernetConfig(proto.EthernetConfig{Mode: ethernetModeDHCP}); err != nil {
		t.Fatalf("enable dhcp: %v", err)
	}
	if _, err := os.Stat(ethernetConfigFile); !os.IsNotExist(err) {
		t.Fatalf("dhcp mode should remove static config, stat error: %v", err)
	}

	got, err = readEthernetConfig()
	if err != nil {
		t.Fatalf("read dhcp config: %v", err)
	}
	if got.Mode != ethernetModeDHCP || got.Interface != ethernetInterface {
		t.Fatalf("unexpected dhcp config: %#v", got)
	}
}

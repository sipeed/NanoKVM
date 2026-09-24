package network

import (
	"os"
	"path/filepath"
	"testing"

	"NanoKVM-Server/proto"
)

func TestValidateStaticEthernet(t *testing.T) {
	prefix, gateway, err := validateStaticEthernet("192.168.10.32", "255.255.255.0", "192.168.10.1")
	if err != nil {
		t.Fatalf("expected valid configuration, got %v", err)
	}
	if prefix.String() != "192.168.10.32/24" || gateway.String() != "192.168.10.1" {
		t.Fatalf("unexpected normalized configuration: %s %s", prefix, gateway)
	}

	for _, test := range []struct {
		name, address, mask, gateway string
	}{
		{"invalid address", "192.168.10.999", "255.255.255.0", "192.168.10.1"},
		{"network address", "192.168.10.0", "255.255.255.0", "192.168.10.1"},
		{"broadcast address", "192.168.10.255", "255.255.255.0", "192.168.10.1"},
		{"noncontiguous mask", "192.168.10.32", "255.0.255.0", "192.168.10.1"},
		{"unsupported mask", "192.168.10.32", "255.255.255.255", "192.168.10.1"},
		{"different subnet gateway", "192.168.10.32", "255.255.255.0", "192.168.11.1"},
		{"same address gateway", "192.168.10.32", "255.255.255.0", "192.168.10.32"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, _, err := validateStaticEthernet(test.address, test.mask, test.gateway); err == nil {
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
		SubnetMask: "255.255.255.0",
		Gateway:    "10.0.0.1",
	}
	if err := writeEthernetConfig(static); err != nil {
		t.Fatalf("write static config: %v", err)
	}

	got, err := readEthernetConfig()
	if err != nil {
		t.Fatalf("read static config: %v", err)
	}
	if got.Mode != ethernetModeStatic || got.Address != static.Address || got.Gateway != static.Gateway || got.SubnetMask != static.SubnetMask {
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

package vpn

import (
	"NanoKVM-Server/service/extensions/vpnpref"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type recordingVPNClient struct {
	stopCalls   int
	resumeCalls int
}

func (c *recordingVPNClient) StopRuntime() error {
	c.stopCalls++
	return nil
}

func (c *recordingVPNClient) Resume() error {
	c.resumeCalls++
	return nil
}

func TestRunningTailscaleUsesDaemonProbeAndFailsClosed(t *testing.T) {
	original := tailscaleServiceRunning
	t.Cleanup(func() { tailscaleServiceRunning = original })

	tailscaleServiceRunning = func() (bool, error) { return true, nil }
	if !running(vpnpref.Tailscale) {
		t.Fatal("running(tailscale) = false with a verified daemon")
	}

	tailscaleServiceRunning = func() (bool, error) { return false, nil }
	if running(vpnpref.Tailscale) {
		t.Fatal("running(tailscale) = true with a verified absent daemon")
	}

	tailscaleServiceRunning = func() (bool, error) { return false, errors.New("temporary proc failure") }
	if !running(vpnpref.Tailscale) {
		t.Fatal("running(tailscale) = false on uncertain daemon state; must fail closed")
	}
}

func TestBootableNetbirdUsesItsOwnEligibilityCheck(t *testing.T) {
	original := netbirdCanStartAtBoot
	t.Cleanup(func() { netbirdCanStartAtBoot = original })

	netbirdCanStartAtBoot = func() bool { return false }
	if bootable(vpnpref.Netbird) {
		t.Fatal("bootable(netbird) accepted a NetBird client its own eligibility check rejected")
	}

	netbirdCanStartAtBoot = func() bool { return true }
	if !bootable(vpnpref.Netbird) {
		t.Fatal("bootable(netbird) ignored a NetBird client accepted by its eligibility check")
	}
}

func TestTailscaleBootableRequiresRegularExecutables(t *testing.T) {
	dir := t.TempDir()
	tailscaledPath := filepath.Join(dir, "tailscaled")
	tailscalePath := filepath.Join(dir, "tailscale")
	scriptPath := filepath.Join(dir, "S98tailscaled")
	for _, path := range []string{tailscaledPath, tailscalePath, scriptPath} {
		if err := os.WriteFile(path, []byte("test"), 0o755); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	if !tailscaleBootable(tailscaledPath, tailscalePath, scriptPath) {
		t.Fatal("tailscaleBootable() rejected regular executable artifacts")
	}
	if err := os.Remove(tailscalePath); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(tailscalePath, 0o755); err != nil {
		t.Fatal(err)
	}
	if tailscaleBootable(tailscaledPath, tailscalePath, scriptPath) {
		t.Fatal("tailscaleBootable() accepted an executable directory")
	}
}

func TestSetPreferenceDoesNotStopOldVPNWhenRollbackCannotResume(t *testing.T) {
	oldPreferenceRead := vpnPreferenceRead
	oldPreferenceWrite := vpnPreferenceWrite
	oldClientFor := vpnClientFor
	oldBootable := vpnBootable
	oldRunning := vpnRunning
	oldConnected := vpnConnected
	oldCanResume := vpnCanResume
	t.Cleanup(func() {
		vpnPreferenceRead = oldPreferenceRead
		vpnPreferenceWrite = oldPreferenceWrite
		vpnClientFor = oldClientFor
		vpnBootable = oldBootable
		vpnRunning = oldRunning
		vpnConnected = oldConnected
		vpnCanResume = oldCanResume
	})

	// A firmware update can leave a connected old NetBird daemon whose binary
	// no longer matches the pin. Resume must refuse it; SetPreference must make
	// that fact a preflight error instead of stopping the tunnel and discovering
	// it only after the preference write fails.
	oldClient := &recordingVPNClient{}
	writes := 0
	vpnPreferenceRead = func() string { return vpnpref.Netbird }
	vpnPreferenceWrite = func(string) error {
		writes++
		return nil
	}
	vpnClientFor = func(vpn string) vpnClient {
		if vpn != vpnpref.Netbird {
			t.Fatalf("rollback client requested for %q, want netbird", vpn)
		}
		return oldClient
	}
	vpnBootable = func(vpn string) bool { return vpn == vpnpref.Tailscale }
	vpnRunning = func(vpn string) bool { return vpn == vpnpref.Netbird }
	vpnConnected = func(vpn string) bool { return vpn == vpnpref.Tailscale }
	vpnCanResume = func(vpn string) error {
		if vpn != vpnpref.Netbird {
			t.Fatalf("rollback preflight requested for %q, want netbird", vpn)
		}
		return errors.New("no netbird installation this firmware can vouch for")
	}

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader("vpn=tailscale"))
	context.Request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	NewService().SetPreference(context)

	var response struct {
		Code int `json:"code"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v; body = %s", err, recorder.Body.String())
	}
	if response.Code != -3 {
		t.Fatalf("response code = %d, want -3; body = %s", response.Code, recorder.Body.String())
	}
	if oldClient.stopCalls != 0 {
		t.Fatalf("StopRuntime called %d times despite impossible rollback", oldClient.stopCalls)
	}
	if oldClient.resumeCalls != 0 {
		t.Fatalf("Resume called %d times before any stop", oldClient.resumeCalls)
	}
	if writes != 0 {
		t.Fatalf("preference Write called %d times despite impossible rollback", writes)
	}
}

func TestTailscaleBootableAcceptsSymlinkToExecutable(t *testing.T) {
	dir := t.TempDir()
	tailscaledPath := filepath.Join(dir, "tailscaled")
	tailscalePath := filepath.Join(dir, "tailscale")
	scriptPath := filepath.Join(dir, "S98tailscaled")
	realBinaryPath := filepath.Join(dir, "tailscale.real")
	for _, path := range []string{tailscaledPath, scriptPath, realBinaryPath} {
		if err := os.WriteFile(path, []byte("test"), 0o755); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	if err := os.Symlink(realBinaryPath, tailscalePath); err != nil {
		t.Fatal(err)
	}
	if !tailscaleBootable(tailscaledPath, tailscalePath, scriptPath) {
		t.Fatal("tailscaleBootable() rejected a symlink to an executable")
	}
}

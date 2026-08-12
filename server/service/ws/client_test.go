package ws

import (
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/inputcontrol"

	"github.com/gorilla/websocket"
)

func TestHeartbeatTimeoutReleasesManualLease(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	coordinator := &inputcontrol.Coordinator{}
	manual := inputcontrol.NewManualSession(control, coordinator)
	defer manual.Close()

	reservation, err := manual.Reserve(context.Background(), inputcontrol.ManualKeyboard, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	reservation.Complete(true)

	connected := make(chan struct{})
	serverDone := make(chan struct{})
	upgrade := websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrade.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("upgrade websocket: %v", err)
			return
		}
		client := &Client{
			ws:               conn,
			hid:              hid.GetHid(),
			manual:           manual,
			keyboard:         make(chan hid.QueuedReport, 1),
			mouse:            make(chan hid.QueuedReport, 1),
			heartbeatTimeout: 30 * time.Millisecond,
		}
		close(connected)
		client.Start()
		close(serverDone)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	select {
	case <-connected:
	case <-time.After(time.Second):
		t.Fatal("websocket client did not connect")
	}

	switchDone := make(chan error, 1)
	go func() {
		switchDone <- control.SwitchToPicoclaw(nil)
	}()

	select {
	case err := <-switchDone:
		if err != nil {
			t.Fatalf("switch after heartbeat timeout failed: %v", err)
		}
	case <-time.After(time.Second):
		t.Fatal("heartbeat timeout did not release the manual control lease")
	}
	if got := control.Current(); got != controlmode.ModePicoclaw {
		t.Fatalf("mode = %q, want picoclaw", got)
	}

	select {
	case <-serverDone:
	case <-time.After(time.Second):
		t.Fatal("websocket client did not close after heartbeat timeout")
	}
}

func TestMouseReportStartsCooldown(t *testing.T) {
	tests := []struct {
		name   string
		report []byte
		want   bool
	}{
		{name: "relative move", report: []byte{0, 10, 0, 0}, want: false},
		{name: "relative wheel", report: []byte{0, 0, 0, 1}, want: true},
		{name: "relative button", report: []byte{1, 0, 0, 0}, want: true},
		{name: "absolute move", report: []byte{0, 1, 0, 1, 0, 0}, want: false},
		{name: "absolute wheel", report: []byte{0, 1, 0, 1, 0, 0xff}, want: true},
		{name: "absolute button", report: []byte{1, 1, 0, 1, 0, 0}, want: true},
		{name: "invalid", report: []byte{0, 1}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := mouseReportStartsCooldown(tt.report); got != tt.want {
				t.Fatalf("mouseReportStartsCooldown(%v) = %v, want %v", tt.report, got, tt.want)
			}
		})
	}
}

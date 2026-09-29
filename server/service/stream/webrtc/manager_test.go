package webrtc

import (
	"NanoKVM-Server/service/stream"
	"testing"

	"github.com/gorilla/websocket"
)

func TestGetClientsForRejectsPreviousEncoderSession(t *testing.T) {
	manager := NewWebRTCManager()
	active := &stream.VideoSubscription{}
	previous := &stream.VideoSubscription{}
	connection := &websocket.Conn{}
	viewer := &Client{}

	manager.mutex.Lock()
	manager.subscription = active
	manager.clients[connection] = viewer
	manager.updateClientSnapshotLocked()
	manager.mutex.Unlock()

	if clients := manager.getClientsFor(previous); len(clients) != 0 {
		t.Fatalf("previous session can see %d active client(s)", len(clients))
	}
	if clients := manager.getClientsFor(active); len(clients) != 1 || clients[0] != viewer {
		t.Fatalf("active session clients = %v, want the current viewer", clients)
	}
}

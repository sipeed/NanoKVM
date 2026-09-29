package direct

import (
	"NanoKVM-Server/service/stream"
	"testing"
)

func TestGetClientsForRejectsPreviousEncoderSession(t *testing.T) {
	streamer := newStreamer()
	active := &stream.VideoSubscription{}
	previous := &stream.VideoSubscription{}
	viewer := &client{}

	streamer.mutex.Lock()
	streamer.subscription = active
	streamer.clients[viewer] = struct{}{}
	streamer.updateClientSnapshotLocked()
	streamer.mutex.Unlock()

	if clients := streamer.getClientsFor(previous); len(clients) != 0 {
		t.Fatalf("previous session can see %d active client(s)", len(clients))
	}
	if clients := streamer.getClientsFor(active); len(clients) != 1 || clients[0] != viewer {
		t.Fatalf("active session clients = %v, want the current viewer", clients)
	}
}

package ws

import (
	"encoding/json"
	"sync"

	"NanoKVM-Server/service/hid"

	log "github.com/sirupsen/logrus"
)

var keyboardLedBroadcaster = newKeyboardLedStatusBroadcaster(broadcastKeyboardLedStatus)

func init() {
	go keyboardLedBroadcaster.Run()

	hid.SubscribeKeyboardLedStatus(func(status hid.KeyboardLedStatus) {
		keyboardLedBroadcaster.Enqueue(status)
	})
}

type keyboardLedStatusBroadcaster struct {
	mutex     sync.Mutex
	pending   *hid.KeyboardLedStatus
	notify    chan struct{}
	broadcast func(hid.KeyboardLedStatus)
}

func newKeyboardLedStatusBroadcaster(
	broadcast func(hid.KeyboardLedStatus),
) *keyboardLedStatusBroadcaster {
	return &keyboardLedStatusBroadcaster{
		notify:    make(chan struct{}, 1),
		broadcast: broadcast,
	}
}

func (b *keyboardLedStatusBroadcaster) Enqueue(status hid.KeyboardLedStatus) {
	b.mutex.Lock()
	b.pending = &status
	b.mutex.Unlock()

	select {
	case b.notify <- struct{}{}:
	default:
	}
}

func (b *keyboardLedStatusBroadcaster) Run() {
	for range b.notify {
		for {
			status, ok := b.takePending()
			if !ok {
				break
			}

			b.broadcast(status)
		}
	}
}

func (b *keyboardLedStatusBroadcaster) takePending() (hid.KeyboardLedStatus, bool) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	if b.pending == nil {
		return hid.KeyboardLedStatus{}, false
	}

	status := *b.pending
	b.pending = nil
	return status, true
}

func sendKeyboardLedStatusSnapshot(client *Client) {
	if err := sendKeyboardLedStatus(client, hid.GetKeyboardLedStatus()); err != nil {
		log.Errorf("failed to send keyboard LED status snapshot: %s", err)
	}
}

func broadcastKeyboardLedStatus(status hid.KeyboardLedStatus) {
	for _, client := range GetManager().GetClients() {
		client.enqueueKeyboardLedStatus(status)
	}
}

func sendKeyboardLedStatus(client *Client, status hid.KeyboardLedStatus) error {
	payload, err := json.Marshal(status)
	if err != nil {
		return err
	}

	return client.Write(hid.KeyboardLedStatusEvent, string(payload))
}

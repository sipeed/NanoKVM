package ws

import (
	"encoding/json"
	"sync"

	"NanoKVM-Server/service/stream"
	log "github.com/sirupsen/logrus"
)

var h264ModeStatusBroadcasterInstance = newH264ModeStatusBroadcaster(broadcastH264ModeStatus)

func init() {
	go h264ModeStatusBroadcasterInstance.Run()

	stream.SubscribeH264ModeStatus(func(status stream.H264ModeStatus) {
		h264ModeStatusBroadcasterInstance.Enqueue(status)
	})
}

type h264ModeStatusBroadcaster struct {
	mutex     sync.Mutex
	pending   *stream.H264ModeStatus
	notify    chan struct{}
	broadcast func(stream.H264ModeStatus)
}

func newH264ModeStatusBroadcaster(broadcast func(stream.H264ModeStatus)) *h264ModeStatusBroadcaster {
	return &h264ModeStatusBroadcaster{
		notify:    make(chan struct{}, 1),
		broadcast: broadcast,
	}
}

func (b *h264ModeStatusBroadcaster) Enqueue(status stream.H264ModeStatus) {
	b.mutex.Lock()
	b.pending = &status
	b.mutex.Unlock()

	select {
	case b.notify <- struct{}{}:
	default:
	}
}

func (b *h264ModeStatusBroadcaster) Run() {
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

func (b *h264ModeStatusBroadcaster) takePending() (stream.H264ModeStatus, bool) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	if b.pending == nil {
		return stream.H264ModeStatus{}, false
	}

	status := *b.pending
	b.pending = nil
	return status, true
}

func sendH264ModeStatusSnapshot(client *Client) {
	if err := sendH264ModeStatus(client, stream.CurrentH264ModeStatus()); err != nil {
		log.Errorf("failed to send h264 mode status snapshot: %s", err)
	}
}

func broadcastH264ModeStatus(status stream.H264ModeStatus) {
	for _, client := range GetManager().GetClients() {
		if err := sendH264ModeStatus(client, status); err != nil {
			log.Errorf("failed to send h264 mode status: %s", err)
		}
	}
}

func sendH264ModeStatus(client *Client, status stream.H264ModeStatus) error {
	payload, err := json.Marshal(status)
	if err != nil {
		return err
	}

	return client.Write(stream.H264ModeStatusEvent, string(payload))
}

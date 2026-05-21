package ws

import (
	"encoding/json"
	"sort"
	"sync"

	"NanoKVM-Server/service/stream"

	log "github.com/sirupsen/logrus"
)

var captureBroadcaster = newCaptureStatusBroadcaster(broadcastCaptureStatus)

func init() {
	go captureBroadcaster.Run()

	stream.SubscribeCaptureStatus(func(status stream.CaptureStatus) {
		captureBroadcaster.Enqueue(status)
	})
}

type captureStatusBroadcaster struct {
	mutex     sync.Mutex
	pending   map[string]stream.CaptureStatus
	notify    chan struct{}
	broadcast func(stream.CaptureStatus)
}

func newCaptureStatusBroadcaster(broadcast func(stream.CaptureStatus)) *captureStatusBroadcaster {
	return &captureStatusBroadcaster{
		pending:   make(map[string]stream.CaptureStatus),
		notify:    make(chan struct{}, 1),
		broadcast: broadcast,
	}
}

func (b *captureStatusBroadcaster) Enqueue(status stream.CaptureStatus) {
	b.mutex.Lock()
	b.pending[status.Mode] = status
	b.mutex.Unlock()

	select {
	case b.notify <- struct{}{}:
	default:
	}
}

func (b *captureStatusBroadcaster) Run() {
	for range b.notify {
		for {
			statuses := b.takePending()
			if len(statuses) == 0 {
				break
			}

			for _, status := range statuses {
				b.broadcast(status)
			}
		}
	}
}

func (b *captureStatusBroadcaster) takePending() []stream.CaptureStatus {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	if len(b.pending) == 0 {
		return nil
	}

	modes := make([]string, 0, len(b.pending))
	for mode := range b.pending {
		modes = append(modes, mode)
	}
	sort.Strings(modes)

	statuses := make([]stream.CaptureStatus, 0, len(modes))
	for _, mode := range modes {
		statuses = append(statuses, b.pending[mode])
		delete(b.pending, mode)
	}

	return statuses
}

func sendCaptureStatusSnapshot(client *Client) {
	for _, status := range stream.LatestCaptureStatuses() {
		if err := sendCaptureStatus(client, status); err != nil {
			log.Errorf("failed to send capture status snapshot: %s", err)
		}
	}
}

func broadcastCaptureStatus(status stream.CaptureStatus) {
	for _, client := range GetManager().GetClients() {
		if err := sendCaptureStatus(client, status); err != nil {
			log.Errorf("failed to send capture status: %s", err)
		}
	}
}

func sendCaptureStatus(client *Client, status stream.CaptureStatus) error {
	payload, err := json.Marshal(status)
	if err != nil {
		log.Errorf("failed to marshal capture status: %s", err)
		return err
	}

	return client.Write(stream.CaptureStatusEvent, string(payload))
}

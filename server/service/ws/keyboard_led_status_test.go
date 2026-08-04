package ws

import (
	"testing"
	"time"

	"NanoKVM-Server/service/hid"
)

func TestKeyboardLedStatusQueueKeepsLatestStatus(t *testing.T) {
	client := &Client{
		keyboardLedNotify: make(chan struct{}, 1),
		keyboardLedDone:   make(chan struct{}),
	}
	first := hid.KeyboardLedStatus{NumLock: true}
	latest := hid.KeyboardLedStatus{CapsLock: true}

	client.enqueueKeyboardLedStatus(first)
	client.enqueueKeyboardLedStatus(latest)

	status, ok := client.takeKeyboardLedStatus()
	if !ok {
		t.Fatal("queued LED status was not available")
	}
	if status != latest {
		t.Fatalf("queued status = %#v, want latest %#v", status, latest)
	}
	if _, ok := client.takeKeyboardLedStatus(); ok {
		t.Fatal("queue retained more than one LED status")
	}
}

func TestKeyboardLedStatusQueueDoesNotBlockWhenWorkerIsBusy(t *testing.T) {
	client := &Client{
		keyboardLedNotify: make(chan struct{}, 1),
		keyboardLedDone:   make(chan struct{}),
	}
	// A pending notification models a worker currently busy writing the prior
	// status to a slow websocket client.
	client.keyboardLedNotify <- struct{}{}

	finished := make(chan struct{})
	go func() {
		client.enqueueKeyboardLedStatus(hid.KeyboardLedStatus{CapsLock: true})
		close(finished)
	}()

	select {
	case <-finished:
	case <-time.After(time.Second):
		t.Fatal("enqueue blocked while the keyboard LED worker was busy")
	}
}

func TestKeyboardLedStatusWorkerStopsOnClientClose(t *testing.T) {
	client := &Client{
		keyboardLedNotify: make(chan struct{}, 1),
		keyboardLedDone:   make(chan struct{}),
	}
	client.startKeyboardLedStatusWorker()
	client.stopKeyboardLedStatusWorker()

	done := make(chan struct{})
	go func() {
		client.workers.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("keyboard LED worker did not stop after client close")
	}

	client.enqueueKeyboardLedStatus(hid.KeyboardLedStatus{ScrollLock: true})
	if _, ok := client.takeKeyboardLedStatus(); ok {
		t.Fatal("closed client accepted a keyboard LED status")
	}
}

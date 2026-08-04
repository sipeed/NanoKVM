package ws

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/hid"
	"NanoKVM-Server/service/inputcontrol"
	"NanoKVM-Server/service/picoclaw"
	"NanoKVM-Server/service/vm/jiggler"

	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const (
	Heartbeat = iota
	KeyboardEvent
	MouseEvent
)

const (
	manualPreemptTimeout   = 2 * time.Second
	clientHeartbeatTimeout = 90 * time.Second
)

func NewClient(ws *websocket.Conn) *Client {
	client := &Client{
		ws:                ws,
		hid:               hid.GetHid(),
		manual:            inputcontrol.NewManualSession(controlmode.GetManager(), inputcontrol.GetCoordinator()),
		keyboard:          make(chan hid.QueuedReport, 200),
		mouse:             make(chan hid.QueuedReport, 200),
		heartbeatTimeout:  clientHeartbeatTimeout,
		keyboardLedNotify: make(chan struct{}, 1),
		keyboardLedDone:   make(chan struct{}),
		lastHeartbeat:     time.Time{},
	}

	client.hid.Open()

	return client
}

func (c *Client) Start() {
	c.startKeyboardLedStatusWorker()

	c.workers.Add(2)
	go func() {
		defer c.workers.Done()
		c.hid.KeyboardReports(c.keyboard)
	}()
	go func() {
		defer c.workers.Done()
		c.hid.MouseReports(c.mouse)
	}()

	_ = c.Read()
	c.Close()
}

func (c *Client) Read() error {
	if err := c.UpdateHeartbeat(); err != nil {
		return err
	}

	for {
		messageType, data, err := c.ws.ReadMessage()
		if err != nil {
			return err
		}
		if err := c.UpdateHeartbeat(); err != nil {
			return err
		}

		if len(data) == 0 {
			continue
		}

		log.Debugf("received message %d: %v", messageType, data)

		switch data[0] {
		case Heartbeat:
		case KeyboardEvent:
			report := data[1:]
			if len(report) != 8 {
				log.Debugf("invalid manual keyboard report: %v", report)
				continue
			}
			c.queueManualReport(c.keyboard, inputcontrol.ManualKeyboard, report, keyboardReportHeld(report), true)
		case MouseEvent:
			report := data[1:]
			if len(report) != 4 && len(report) != 6 {
				log.Debugf("invalid manual mouse report: %v", report)
				continue
			}
			kind := inputcontrol.ManualRelativeMouse
			if len(report) == 6 {
				kind = inputcontrol.ManualAbsoluteMouse
			}
			c.queueManualReport(c.mouse, kind, report, report[0] != 0, mouseReportStartsCooldown(report))
		}
	}
}

func (c *Client) queueManualReport(queue chan hid.QueuedReport, kind inputcontrol.ManualReportKind, report []byte, held bool, startCooldown bool) {
	ctx, cancel := context.WithTimeout(context.Background(), manualPreemptTimeout)
	defer cancel()

	reservation, err := c.manual.ReserveWithCooldown(ctx, kind, held, startCooldown, func(mode controlmode.Mode) bool {
		return mode != controlmode.ModePicoclaw || !picoclaw.GetSessionLock().BlocksManualInput()
	})
	if err != nil {
		if errors.Is(err, inputcontrol.ErrManualInputBlocked) {
			log.Debug("manual HID input dropped while PicoClaw session holds control")
		} else {
			log.Errorf("manual HID input failed to acquire control: %s", err)
		}
		return
	}

	queued := hid.QueuedReport{
		Data:               append([]byte(nil), report...),
		Execute:            c.manual.Execute,
		Complete:           reservation.Complete,
		ResetKeyboard:      func() { c.manual.Reset(inputcontrol.ManualKeyboard) },
		ResetRelativeMouse: func() { c.manual.Reset(inputcontrol.ManualRelativeMouse) },
		ResetAbsoluteMouse: func() { c.manual.Reset(inputcontrol.ManualAbsoluteMouse) },
	}
	if !writeQueue(queue, queued) {
		return
	}
	jiggler.GetJiggler().Update()
}

func keyboardReportHeld(report []byte) bool {
	if len(report) != 8 {
		return false
	}
	if report[0] != 0 {
		return true
	}
	for _, key := range report[2:] {
		if key != 0 {
			return true
		}
	}
	return false
}

func mouseReportStartsCooldown(report []byte) bool {
	if len(report) != 4 && len(report) != 6 {
		return true
	}
	if report[0] != 0 {
		return true
	}
	return report[len(report)-1] != 0
}

func (c *Client) Write(event string, data string) error {
	message := &Message{
		Type: event,
		Data: data,
	}

	messageByte, err := json.Marshal(message)
	if err != nil {
		log.Errorf("failed to marshal message: %s", err)
		return err
	}

	c.mutex.Lock()
	defer c.mutex.Unlock()

	_ = c.ws.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.ws.WriteMessage(websocket.TextMessage, messageByte)
}

func (c *Client) UpdateHeartbeat() error {
	now := time.Now()
	timeout := c.heartbeatTimeout
	if timeout <= 0 {
		timeout = clientHeartbeatTimeout
	}
	c.mutex.Lock()
	c.lastHeartbeat = now
	c.mutex.Unlock()

	return c.ws.SetReadDeadline(now.Add(timeout))
}

func (c *Client) Close() {
	c.closeOnce.Do(func() {
		if c.ws != nil {
			_ = c.ws.Close()
		}
		c.stopKeyboardLedStatusWorker()

		if c.keyboard != nil {
			close(c.keyboard)
		}
		if c.mouse != nil {
			close(c.mouse)
		}
	})
	c.workers.Wait()
	c.keyboardLedWorkers.Wait()
	if c.manual != nil {
		c.manual.Close()
	}
	log.Debug("websocket disconnected")
}

// enqueueKeyboardLedStatus records only the newest status for this client. It
// never waits for a WebSocket write, so a client which stops reading cannot
// delay LED updates for the other connected clients.
func (c *Client) enqueueKeyboardLedStatus(status hid.KeyboardLedStatus) {
	c.keyboardLedMutex.Lock()
	if c.keyboardLedClosed || c.keyboardLedNotify == nil {
		c.keyboardLedMutex.Unlock()
		return
	}
	c.keyboardLedStatus = &status
	notify := c.keyboardLedNotify
	c.keyboardLedMutex.Unlock()

	select {
	case notify <- struct{}{}:
	default:
	}
}

func (c *Client) startKeyboardLedStatusWorker() {
	c.keyboardLedMutex.Lock()
	if c.keyboardLedClosed {
		c.keyboardLedMutex.Unlock()
		return
	}
	if c.keyboardLedNotify == nil {
		c.keyboardLedNotify = make(chan struct{}, 1)
	}
	if c.keyboardLedDone == nil {
		c.keyboardLedDone = make(chan struct{})
	}
	c.keyboardLedMutex.Unlock()

	c.keyboardLedOnce.Do(func() {
		c.keyboardLedWorkers.Add(1)
		go func() {
			defer c.keyboardLedWorkers.Done()
			c.runKeyboardLedStatusWorker()
		}()
	})
}

func (c *Client) stopKeyboardLedStatusWorker() {
	c.keyboardLedMutex.Lock()
	defer c.keyboardLedMutex.Unlock()
	if c.keyboardLedClosed {
		return
	}
	c.keyboardLedClosed = true
	if c.keyboardLedDone != nil {
		close(c.keyboardLedDone)
	}
}

func (c *Client) runKeyboardLedStatusWorker() {
	for {
		c.keyboardLedMutex.Lock()
		notify := c.keyboardLedNotify
		done := c.keyboardLedDone
		c.keyboardLedMutex.Unlock()

		select {
		case <-done:
			return
		case <-notify:
		}

		for {
			status, ok := c.takeKeyboardLedStatus()
			if !ok {
				break
			}
			if err := sendKeyboardLedStatus(c, status); err != nil {
				log.Errorf("failed to send keyboard LED status: %s", err)
			}
		}
	}
}

func (c *Client) takeKeyboardLedStatus() (hid.KeyboardLedStatus, bool) {
	c.keyboardLedMutex.Lock()
	defer c.keyboardLedMutex.Unlock()
	if c.keyboardLedStatus == nil {
		return hid.KeyboardLedStatus{}, false
	}

	status := *c.keyboardLedStatus
	c.keyboardLedStatus = nil
	return status, true
}

func writeQueue(queue chan hid.QueuedReport, report hid.QueuedReport) bool {
	if !sendQueue(queue, report) {
		report.Complete(false)
		log.Debug("hid event dropped because websocket queue is closed")
		return false
	}
	return true
}

func sendQueue(queue chan hid.QueuedReport, report hid.QueuedReport) (ok bool) {
	if queue == nil {
		return false
	}

	defer func() {
		if r := recover(); r != nil {
			ok = false
		}
	}()

	queue <- report
	return true
}

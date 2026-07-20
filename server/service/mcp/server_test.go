package mcpservice

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/inputcontrol"
)

type fakeSnapshotter struct {
	snapshot Snapshot
	err      error
}

func (s fakeSnapshotter) Capture(context.Context, SnapshotRequest) (Snapshot, error) {
	return s.snapshot, s.err
}

func TestScreenshotHandlerReturnsImage(t *testing.T) {
	handler := screenshotHandler(nil, fakeSnapshotter{snapshot: Snapshot{
		OK: true, Width: 800, Height: 600, JPEG: []byte{0xff, 0xd8, 0xff},
	}})
	result, output, err := handler(context.Background(), nil, ScreenshotParams{})
	if err != nil {
		t.Fatal(err)
	}
	if result == nil || result.IsError || len(result.Content) != 1 || !output.OK || output.Size != 3 {
		t.Fatalf("result=%+v output=%+v", result, output)
	}
}

func TestResolveDelayMSDefaultsOnlyWhenOmitted(t *testing.T) {
	if got := resolveDelayMS(nil, defaultTypeDelayMS); got != defaultTypeDelayMS {
		t.Fatalf("omitted delay = %d, want %d", got, defaultTypeDelayMS)
	}

	zero := 0
	if got := resolveDelayMS(&zero, defaultTypeDelayMS); got != 0 {
		t.Fatalf("explicit zero delay = %d, want 0", got)
	}
}

func TestTypeTextSchemaMatchesDurationBudget(t *testing.T) {
	if maxTypeTextRunes != 1000 {
		t.Fatalf("maxTypeTextRunes = %d, want 1000", maxTypeTextRunes)
	}
	schema := typeTextSchema()
	maxLength := schema.Properties["text"].MaxLength
	if maxLength == nil || *maxLength != maxTypeTextRunes {
		t.Fatalf("schema maxLength = %v, want %d", maxLength, maxTypeTextRunes)
	}

	tooLong := strings.Repeat("a", maxTypeTextRunes+1)
	handler := typeTextHandler(nil, nil)
	if _, _, err := handler(context.Background(), nil, TypeTextParams{Text: tooLong}); err == nil || !strings.Contains(err.Error(), "maximum length") {
		t.Fatalf("too-long error = %v, want maximum length", err)
	}

	delayMS := defaultTypeDelayMS + 1
	maxLengthText := strings.Repeat("a", maxTypeTextRunes)
	if _, _, err := handler(context.Background(), nil, TypeTextParams{Text: maxLengthText, DelayMS: &delayMS}); err == nil || !strings.Contains(err.Error(), "typing duration exceeds") {
		t.Fatalf("duration error = %v, want duration budget", err)
	}
}

func TestMoveMouseHandlerDoesNotRateLimitRapidMoves(t *testing.T) {
	hid := &recordingHID{}
	handler := moveMouseHandler(nil, newRemoteWithHID(hid))
	x, y := 0.5, 0.5

	for i := 0; i < 2; i++ {
		if _, _, err := handler(context.Background(), nil, MoveMouseParams{Mode: "absolute", X: &x, Y: &y}); err != nil {
			t.Fatalf("move %d error = %v", i+1, err)
		}
	}
	if len(hid.absolute) != 2 {
		t.Fatalf("absolute writes = %d, want 2", len(hid.absolute))
	}
}

func TestMCPInitializeAndToolsList(t *testing.T) {
	hid := &recordingHID{}
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	handler := newMCPHandler(control, &inputcontrol.Coordinator{}, newRemoteWithHID(hid), fakeSnapshotter{snapshot: Snapshot{
		OK: true, Width: 800, Height: 600, JPEG: []byte{0xff, 0xd8, 0xff},
	}})

	request := func(method string, body string, sessionID string) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		req := httptest.NewRequest(method, "/api/mcp", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json, text/event-stream")
		if sessionID != "" {
			req.Header.Set("Mcp-Session-Id", sessionID)
			req.Header.Set("Mcp-Protocol-Version", "2025-03-26")
		}
		handler.ServeHTTP(recorder, req)
		return recorder
	}

	initialize := request(http.MethodPost, `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}`, "")
	if initialize.Code != http.StatusOK {
		t.Fatalf("initialize status=%d body=%s", initialize.Code, initialize.Body.String())
	}
	sessionID := initialize.Header().Get("Mcp-Session-Id")
	if sessionID == "" || !strings.Contains(initialize.Body.String(), "nanokvm-cube-remote-control") {
		t.Fatalf("session=%q body=%s", sessionID, initialize.Body.String())
	}

	initialized := request(http.MethodPost, `{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}`, sessionID)
	if initialized.Code != http.StatusAccepted {
		t.Fatalf("initialized status=%d body=%s", initialized.Code, initialized.Body.String())
	}

	tools := request(http.MethodPost, `{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}`, sessionID)
	if tools.Code != http.StatusOK {
		t.Fatalf("tools/list status=%d body=%s", tools.Code, tools.Body.String())
	}
	for _, name := range []string{"cube_type_text", "cube_press_keys", "cube_move_mouse", "cube_click_mouse", "cube_scroll_mouse", "cube_screenshot"} {
		if !strings.Contains(tools.Body.String(), `"name":"`+name+`"`) {
			t.Fatalf("tools/list missing %s: %s", name, tools.Body.String())
		}
	}
	for _, name := range []string{"type_text", "press_keys", "move_mouse", "click_mouse", "scroll_mouse", "screenshot"} {
		if strings.Contains(tools.Body.String(), `"name":"`+name+`"`) {
			t.Fatalf("tools/list exposes unprefixed tool %s: %s", name, tools.Body.String())
		}
	}

	calls := []struct {
		id        int
		name      string
		arguments string
	}{
		{3, "cube_type_text", `{"text":"A","delayMs":1}`},
		{4, "cube_press_keys", `{"keys":["ControlLeft","AltLeft","KeyA","KeyB","KeyC","KeyD","KeyE","KeyF"],"holdMs":1}`},
		{5, "cube_move_mouse", `{"mode":"absolute","x":0.5,"y":0.5}`},
		{6, "cube_click_mouse", `{"button":"left","clicks":1}`},
		{7, "cube_scroll_mouse", `{"deltaY":1}`},
		{8, "cube_screenshot", `{"quality":75}`},
	}
	for _, call := range calls {
		body := `{"jsonrpc":"2.0","id":` + fmt.Sprint(call.id) + `,"method":"tools/call","params":{"name":"` + call.name + `","arguments":` + call.arguments + `}}`
		response := request(http.MethodPost, body, sessionID)
		if response.Code != http.StatusOK || strings.Contains(response.Body.String(), `"isError":true`) {
			t.Fatalf("tools/call %s status=%d body=%s", call.name, response.Code, response.Body.String())
		}
		if call.name == "cube_screenshot" && !strings.Contains(response.Body.String(), "image/jpeg") {
			t.Fatalf("screenshot response missing image: %s", response.Body.String())
		}
	}

	invalidCalls := []struct {
		id        int
		name      string
		arguments string
	}{
		{9, "cube_move_mouse", `{"mode":"absolute"}`},
		{10, "cube_move_mouse", `{"mode":"absolute","x":1.1,"y":0.5}`},
		{11, "cube_click_mouse", `{"mode":"absolute","button":"left"}`},
		{12, "cube_screenshot", `{"x":10}`},
		{13, "cube_move_mouse", `{"mode":"relative","x":0.5,"y":0.5}`},
		{14, "cube_move_mouse", `{"mode":"relative"}`},
		{15, "cube_click_mouse", `{"mode":"absolute","button":"middle","x":0.5,"y":0.5}`},
		{16, "cube_click_mouse", `{"button":"back"}`},
		{17, "cube_press_keys", `{"keys":["MediaPlayPause"]}`},
	}
	for _, call := range invalidCalls {
		body := `{"jsonrpc":"2.0","id":` + fmt.Sprint(call.id) + `,"method":"tools/call","params":{"name":"` + call.name + `","arguments":` + call.arguments + `}}`
		response := request(http.MethodPost, body, sessionID)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"isError":true`) {
			t.Fatalf("invalid tools/call %s status=%d body=%s", call.name, response.Code, response.Body.String())
		}
	}

	closed := request(http.MethodDelete, "", sessionID)
	if closed.Code != http.StatusNoContent {
		t.Fatalf("delete status=%d body=%s", closed.Code, closed.Body.String())
	}
}

func TestMCPHandlerRejectsCrossOriginBrowserRequests(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	handler := http.NewCrossOriginProtection().Handler(newMCPHandler(control, &inputcontrol.Coordinator{}, newRemoteWithHID(&recordingHID{}), nil))

	request := func(origin string) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "http://nanokvm.local/api/mcp", strings.NewReader(`{}`))
		req.Header.Set("Origin", origin)
		handler.ServeHTTP(recorder, req)
		return recorder
	}

	if got := request("https://evil.example").Code; got != http.StatusForbidden {
		t.Fatalf("cross-origin status = %d, want 403", got)
	}
	if got := request("http://nanokvm.local").Code; got == http.StatusForbidden {
		t.Fatalf("same-origin request was rejected with status %d", got)
	}
}

func TestMCPHandlerRejectsOversizedRequestBody(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	handler := newMCPHandler(control, &inputcontrol.Coordinator{}, newRemoteWithHID(&recordingHID{}), nil)
	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(
		http.MethodPost,
		"/api/mcp",
		strings.NewReader(strings.Repeat(" ", maxRequestBodyBytes+1)),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")

	handler.ServeHTTP(recorder, req)
	if recorder.Code == http.StatusOK {
		t.Fatalf("oversized request was accepted: status=%d", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "failed to read body") {
		t.Fatalf("unexpected oversized response: status=%d body=%q", recorder.Code, recorder.Body.String())
	}
}

func TestToolExecutorRejectsConcurrentControl(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	coordinator := &inputcontrol.Coordinator{}
	executor := &toolExecutor{control: control, coordinator: coordinator}

	_, release, err := executor.begin(context.Background(), inputcontrol.OperationHID)
	if err != nil {
		t.Fatal(err)
	}
	defer release()

	if _, _, err := executor.begin(context.Background(), inputcontrol.OperationHID); !errors.Is(err, inputcontrol.ErrMCPBusy) {
		t.Fatalf("error = %v, want busy", err)
	}
}

func TestManualControlBlocksHIDButAllowsScreenshot(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	coordinator := &inputcontrol.Coordinator{}
	manual := inputcontrol.NewManualSession(control, coordinator)
	defer manual.Close()

	reservation, err := manual.Reserve(context.Background(), inputcontrol.ManualRelativeMouse, true, nil)
	if err != nil {
		t.Fatal(err)
	}
	reservation.Complete(true)

	hid := &recordingHID{}
	executor := &toolExecutor{control: control, coordinator: coordinator}
	x, y := 0.5, 0.5
	_, _, err = moveMouseHandler(executor, newRemoteWithHID(hid))(
		context.Background(), nil, MoveMouseParams{Mode: "absolute", X: &x, Y: &y},
	)
	if !errors.Is(err, inputcontrol.ErrManualControlActive) {
		t.Fatalf("move error = %v, want manual-control busy", err)
	}
	if hid.writes != 0 {
		t.Fatalf("manual-control rejection wrote %d HID reports", hid.writes)
	}

	result, output, err := screenshotHandler(executor, fakeSnapshotter{snapshot: Snapshot{
		OK: true, Width: 800, Height: 600, JPEG: []byte{0xff, 0xd8, 0xff},
	}})(context.Background(), nil, ScreenshotParams{})
	if err != nil {
		t.Fatalf("screenshot was blocked by manual control: %v", err)
	}
	if result == nil || !output.OK {
		t.Fatalf("result=%+v output=%+v", result, output)
	}

	manual.Reset(inputcontrol.ManualRelativeMouse)
	if got := control.Current(); got != controlmode.ModeMCP {
		t.Fatalf("mode = %q, want MCP to remain enabled", got)
	}
}

func TestModeSwitchCancelsActiveMCPTool(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	coordinator := &inputcontrol.Coordinator{}
	hid := &recordingHID{}
	started := make(chan struct{}, 1)
	hid.onWrite = func(write int) {
		if write == 1 {
			started <- struct{}{}
		}
	}
	handler := typeTextHandler(
		&toolExecutor{control: control, coordinator: coordinator},
		newRemoteWithHID(hid),
	)

	toolDone := make(chan error, 1)
	go func() {
		delayMS := 1000
		_, _, err := handler(context.Background(), nil, TypeTextParams{Text: "AB", DelayMS: &delayMS})
		toolDone <- err
	}()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("MCP tool did not start")
	}

	switched, err := control.SwitchIf(controlmode.ModeMCP, controlmode.ModeOff, func() error {
		coordinator.CancelMCP()
		return nil
	})
	if err != nil || !switched {
		t.Fatalf("switched=%v err=%v", switched, err)
	}
	select {
	case err := <-toolDone:
		if !errors.Is(err, inputcontrol.ErrMCPModeChanged) {
			t.Fatalf("tool error=%v, want mode-change cancellation", err)
		}
	case <-time.After(time.Second):
		t.Fatal("canceled MCP tool did not return")
	}
}

func TestManualInputCancelsActiveMCPToolAndKeepsModeEnabled(t *testing.T) {
	control := controlmode.NewManager(filepath.Join(t.TempDir(), "mode"), controlmode.ModeMCP)
	coordinator := &inputcontrol.Coordinator{}
	hid := &recordingHID{}
	started := make(chan struct{}, 1)
	hid.onWrite = func(write int) {
		if write == 1 {
			started <- struct{}{}
		}
	}
	handler := typeTextHandler(
		&toolExecutor{control: control, coordinator: coordinator},
		newRemoteWithHID(hid),
	)

	toolDone := make(chan error, 1)
	go func() {
		delayMS := 1000
		_, _, err := handler(context.Background(), nil, TypeTextParams{Text: "AB", DelayMS: &delayMS})
		toolDone <- err
	}()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("MCP tool did not start")
	}

	manual := inputcontrol.NewManualSession(control, coordinator)
	defer manual.Close()
	reservationDone := make(chan *inputcontrol.ManualReservation, 1)
	reservationErr := make(chan error, 1)
	go func() {
		reservation, err := manual.Reserve(context.Background(), inputcontrol.ManualKeyboard, false, nil)
		if err != nil {
			reservationErr <- err
			return
		}
		reservationDone <- reservation
	}()

	select {
	case err := <-toolDone:
		if !errors.Is(err, inputcontrol.ErrManualPreempted) {
			t.Fatalf("tool error=%v, want manual preemption", err)
		}
	case <-time.After(time.Second):
		t.Fatal("manual input did not cancel MCP tool")
	}

	select {
	case err := <-reservationErr:
		t.Fatal(err)
	case reservation := <-reservationDone:
		reservation.Complete(true)
	case <-time.After(time.Second):
		t.Fatal("manual input did not acquire control after MCP cleanup")
	}
	if got := control.Current(); got != controlmode.ModeMCP {
		t.Fatalf("mode = %q, want MCP to remain enabled", got)
	}
	if len(hid.keyboard) < 2 || string(hid.keyboard[len(hid.keyboard)-1]) != string(keyUpReport) {
		t.Fatalf("keyboard was not released before manual takeover: %v", hid.keyboard)
	}
}

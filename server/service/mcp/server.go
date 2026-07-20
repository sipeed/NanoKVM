package mcpservice

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"NanoKVM-Server/service/controlmode"
	"NanoKVM-Server/service/inputcontrol"

	"github.com/google/jsonschema-go/jsonschema"
	protocol "github.com/modelcontextprotocol/go-sdk/mcp"
)

const (
	mcpServerName       = "nanokvm-cube-remote-control"
	typeTextToolName    = "cube_type_text"
	pressKeysToolName   = "cube_press_keys"
	moveMouseToolName   = "cube_move_mouse"
	clickMouseToolName  = "cube_click_mouse"
	scrollMouseToolName = "cube_scroll_mouse"
	screenshotToolName  = "cube_screenshot"
	defaultTypeDelayMS  = 30
	defaultHoldMS       = 50
	defaultClickDelayMS = 50
	maxPressKeyItems    = maxKeyboardKeys + 8
	maxTypeTextDuration = 30 * time.Second
	maxTypeTextRunes    = int(maxTypeTextDuration / (defaultTypeDelayMS * time.Millisecond))
	maxRequestBodyBytes = 1 << 20
)

type TypeTextParams struct {
	Text    string `json:"text" jsonschema:"text to type on the remote host"`
	DelayMS *int   `json:"delayMs,omitempty" jsonschema:"delay between typed characters in milliseconds"`
}

type TypeTextResult struct {
	Typed        int    `json:"typed"`
	Skipped      string `json:"skipped,omitempty"`
	SkippedCount int    `json:"skippedCount"`
}

type PressKeysParams struct {
	Keys   []string `json:"keys" jsonschema:"KeyboardEvent.code key names"`
	HoldMS *int     `json:"holdMs,omitempty" jsonschema:"hold time in milliseconds"`
}

type MoveMouseParams struct {
	Mode   string   `json:"mode" jsonschema:"absolute or relative"`
	X      *float64 `json:"x,omitempty" jsonschema:"absolute normalized x"`
	Y      *float64 `json:"y,omitempty" jsonschema:"absolute normalized y"`
	DeltaX int      `json:"deltaX,omitempty" jsonschema:"relative x movement"`
	DeltaY int      `json:"deltaY,omitempty" jsonschema:"relative y movement"`
}

type ClickMouseParams struct {
	Button string   `json:"button" jsonschema:"left, right, or middle"`
	Clicks int      `json:"clicks,omitempty" jsonschema:"number of clicks"`
	Mode   string   `json:"mode,omitempty" jsonschema:"absolute or relative"`
	X      *float64 `json:"x,omitempty" jsonschema:"absolute normalized x"`
	Y      *float64 `json:"y,omitempty" jsonschema:"absolute normalized y"`
}

type ScrollMouseParams struct {
	DeltaY int `json:"deltaY" jsonschema:"vertical wheel movement"`
}

type ScreenshotParams struct {
	Quality   int  `json:"quality,omitempty"`
	TimeoutMS *int `json:"timeoutMs,omitempty"`
}

type ScreenshotResult struct {
	OK      bool   `json:"ok"`
	RetCode int    `json:"retCode"`
	Message string `json:"message"`
	Width   int    `json:"width"`
	Height  int    `json:"height"`
	Size    int    `json:"size"`
}

type ToolOKResult struct {
	OK bool `json:"ok"`
}

type toolExecutor struct {
	control     *controlmode.Manager
	coordinator *inputcontrol.Coordinator
}

func NewMCPHandler(control *controlmode.Manager, snapshotter Snapshotter) http.Handler {
	return newMCPHandler(control, inputcontrol.GetCoordinator(), NewRemote(), snapshotter)
}

func newMCPHandler(control *controlmode.Manager, coordinator *inputcontrol.Coordinator, remote *Remote, snapshotter Snapshotter) http.Handler {
	executor := &toolExecutor{control: control, coordinator: coordinator}
	server := protocol.NewServer(&protocol.Implementation{
		Name:    mcpServerName,
		Version: "v1.0.0",
	}, nil)
	registerTools(server, executor, remote, snapshotter)
	handler := protocol.NewStreamableHTTPHandler(
		func(*http.Request) *protocol.Server { return server },
		&protocol.StreamableHTTPOptions{Stateless: true},
	)
	return http.MaxBytesHandler(handler, maxRequestBodyBytes)
}

func registerTools(server *protocol.Server, executor *toolExecutor, remote *Remote, snapshotter Snapshotter) {
	protocol.AddTool(server, &protocol.Tool{Name: typeTextToolName, Description: "Type short text into the remote host", InputSchema: typeTextSchema()}, typeTextHandler(executor, remote))
	protocol.AddTool(server, &protocol.Tool{Name: pressKeysToolName, Description: "Press one keyboard shortcut on the remote host", InputSchema: pressKeysSchema()}, pressKeysHandler(executor, remote))
	protocol.AddTool(server, &protocol.Tool{Name: moveMouseToolName, Description: "Move the remote mouse pointer", InputSchema: moveMouseSchema()}, moveMouseHandler(executor, remote))
	protocol.AddTool(server, &protocol.Tool{Name: clickMouseToolName, Description: "Click a remote mouse button", InputSchema: clickMouseSchema()}, clickMouseHandler(executor, remote))
	protocol.AddTool(server, &protocol.Tool{Name: scrollMouseToolName, Description: "Scroll the remote mouse wheel", InputSchema: scrollMouseSchema()}, scrollMouseHandler(executor, remote))
	protocol.AddTool(server, &protocol.Tool{Name: screenshotToolName, Description: "Capture a JPEG screenshot from the remote display", InputSchema: screenshotSchema()}, screenshotHandler(executor, snapshotter))
}

func typeTextHandler(executor *toolExecutor, remote *Remote) protocol.ToolHandlerFor[TypeTextParams, TypeTextResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input TypeTextParams) (*protocol.CallToolResult, TypeTextResult, error) {
		textRunes := []rune(input.Text)
		if len(textRunes) > maxTypeTextRunes {
			return nil, TypeTextResult{}, fmt.Errorf("text exceeds maximum length of %d runes", maxTypeTextRunes)
		}
		delay := time.Duration(resolveDelayMS(input.DelayMS, defaultTypeDelayMS)) * time.Millisecond
		reports, _ := buildTypeReports(input.Text)
		typeableRunes := len(reports) / 2
		if time.Duration(typeableRunes)*delay > maxTypeTextDuration {
			return nil, TypeTextResult{}, fmt.Errorf("typing duration exceeds %s for %d typeable runes at %s delay", maxTypeTextDuration, typeableRunes, delay)
		}
		operationCtx, release, err := executor.begin(ctx, inputcontrol.OperationHID)
		if err != nil {
			return nil, TypeTextResult{}, err
		}
		defer release()

		skipped, err := remote.TypeText(operationCtx, input.Text, delay)
		if err != nil {
			return nil, TypeTextResult{}, err
		}

		return nil, TypeTextResult{
			Typed:        len(textRunes) - len(skipped),
			Skipped:      string(skipped),
			SkippedCount: len(skipped),
		}, nil
	}
}

func pressKeysHandler(executor *toolExecutor, remote *Remote) protocol.ToolHandlerFor[PressKeysParams, ToolOKResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input PressKeysParams) (*protocol.CallToolResult, ToolOKResult, error) {
		if len(input.Keys) == 0 {
			return nil, ToolOKResult{}, fmt.Errorf("keys must not be empty")
		}
		operationCtx, release, err := executor.begin(ctx, inputcontrol.OperationHID)
		if err != nil {
			return nil, ToolOKResult{}, err
		}
		defer release()
		if err := remote.PressKeys(operationCtx, input.Keys, time.Duration(resolveDelayMS(input.HoldMS, defaultHoldMS))*time.Millisecond); err != nil {
			return nil, ToolOKResult{}, err
		}
		return nil, ToolOKResult{OK: true}, nil
	}
}

func moveMouseHandler(executor *toolExecutor, remote *Remote) protocol.ToolHandlerFor[MoveMouseParams, ToolOKResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input MoveMouseParams) (*protocol.CallToolResult, ToolOKResult, error) {
		mode := normalizedMode(input.Mode, "absolute")
		if err := validateMoveMouseInput(mode, input); err != nil {
			return nil, ToolOKResult{}, err
		}
		operationCtx, release, err := executor.begin(ctx, inputcontrol.OperationHID)
		if err != nil {
			return nil, ToolOKResult{}, err
		}
		defer release()
		switch mode {
		case "absolute":
			x, y, err := normalizedCoordinates(input.X, input.Y)
			if err != nil {
				return nil, ToolOKResult{}, err
			}
			if err := remote.MoveAbsolute(operationCtx, x, y); err != nil {
				return nil, ToolOKResult{}, err
			}
		case "relative":
			if err := remote.MoveRelative(operationCtx, input.DeltaX, input.DeltaY); err != nil {
				return nil, ToolOKResult{}, err
			}
		default:
			return nil, ToolOKResult{}, fmt.Errorf("unknown mouse mode: %s", input.Mode)
		}
		return nil, ToolOKResult{OK: true}, nil
	}
}

func clickMouseHandler(executor *toolExecutor, remote *Remote) protocol.ToolHandlerFor[ClickMouseParams, ToolOKResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input ClickMouseParams) (*protocol.CallToolResult, ToolOKResult, error) {
		button := strings.ToLower(strings.TrimSpace(input.Button))
		if button == "" {
			button = "left"
		}
		clicks, err := normalizeClickCount(input.Clicks)
		if err != nil {
			return nil, ToolOKResult{}, err
		}
		mode := normalizedMode(input.Mode, "relative")
		if err := validateClickMouseInput(mode, button, input); err != nil {
			return nil, ToolOKResult{}, err
		}
		operationCtx, release, err := executor.begin(ctx, inputcontrol.OperationHID)
		if err != nil {
			return nil, ToolOKResult{}, err
		}
		defer release()
		switch mode {
		case "absolute":
			x, y, err := normalizedCoordinates(input.X, input.Y)
			if err != nil {
				return nil, ToolOKResult{}, err
			}
			for i := 0; i < clicks; i++ {
				if err := remote.TouchAbsoluteButton(operationCtx, x, y, button, defaultClickDelayMS*time.Millisecond); err != nil {
					return nil, ToolOKResult{}, err
				}
				if i+1 < clicks {
					if err := sleepContext(operationCtx, defaultClickDelayMS*time.Millisecond); err != nil {
						return nil, ToolOKResult{}, err
					}
				}
			}
		case "relative":
			if err := remote.Click(operationCtx, button, clicks, defaultClickDelayMS*time.Millisecond); err != nil {
				return nil, ToolOKResult{}, err
			}
		default:
			return nil, ToolOKResult{}, fmt.Errorf("unknown mouse mode: %s", input.Mode)
		}

		return nil, ToolOKResult{OK: true}, nil
	}
}

func scrollMouseHandler(executor *toolExecutor, remote *Remote) protocol.ToolHandlerFor[ScrollMouseParams, ToolOKResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input ScrollMouseParams) (*protocol.CallToolResult, ToolOKResult, error) {
		operationCtx, release, err := executor.begin(ctx, inputcontrol.OperationHID)
		if err != nil {
			return nil, ToolOKResult{}, err
		}
		defer release()
		if err := remote.Scroll(operationCtx, input.DeltaY); err != nil {
			return nil, ToolOKResult{}, err
		}
		return nil, ToolOKResult{OK: true}, nil
	}
}

func screenshotHandler(executor *toolExecutor, snapshotter Snapshotter) protocol.ToolHandlerFor[ScreenshotParams, ScreenshotResult] {
	return func(ctx context.Context, _ *protocol.CallToolRequest, input ScreenshotParams) (*protocol.CallToolResult, ScreenshotResult, error) {
		if snapshotter == nil {
			return toolError("screenshot capture is unavailable"), ScreenshotResult{Message: "screenshot capture is unavailable"}, nil
		}

		snapshot, err := snapshotter.Capture(ctx, SnapshotRequest{
			Quality: input.Quality, TimeoutMS: input.TimeoutMS,
		})
		output := ScreenshotResult{
			OK: snapshot.OK, RetCode: snapshot.RetCode, Message: snapshot.Message,
			Width: snapshot.Width, Height: snapshot.Height, Size: len(snapshot.JPEG),
		}
		if err != nil {
			output.Message = err.Error()
			return toolError(err.Error()), output, nil
		}
		if !snapshot.OK || len(snapshot.JPEG) == 0 {
			message := snapshot.Message
			if message == "" {
				message = "screenshot capture failed"
			}
			return toolError(message), output, nil
		}

		return &protocol.CallToolResult{Content: []protocol.Content{
			&protocol.ImageContent{Data: snapshot.JPEG, MIMEType: "image/jpeg"},
		}}, output, nil
	}
}

func resolveDelayMS(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return clampInt(*value, 0, 1000)
}

func normalizeClickCount(value int) (int, error) {
	if value == 0 {
		return 1, nil
	}
	if value < 1 || value > 5 {
		return 0, fmt.Errorf("clicks must be between 1 and 5")
	}
	return value, nil
}

func normalizedCoordinates(x *float64, y *float64) (float64, float64, error) {
	if x == nil || y == nil {
		return 0, 0, fmt.Errorf("absolute mode requires both x and y")
	}
	if *x < 0 || *x > 1 || *y < 0 || *y > 1 {
		return 0, 0, fmt.Errorf("absolute coordinates must be between 0 and 1")
	}
	return *x, *y, nil
}

func validateMoveMouseInput(mode string, input MoveMouseParams) error {
	switch mode {
	case "absolute":
		if input.DeltaX != 0 || input.DeltaY != 0 {
			return fmt.Errorf("absolute mode does not accept relative deltas")
		}
		_, _, err := normalizedCoordinates(input.X, input.Y)
		return err
	case "relative":
		if input.X != nil || input.Y != nil {
			return fmt.Errorf("relative mode does not accept absolute coordinates")
		}
		if input.DeltaX == 0 && input.DeltaY == 0 {
			return fmt.Errorf("relative mode requires deltaX or deltaY")
		}
		return nil
	default:
		return fmt.Errorf("unknown mouse mode: %s", mode)
	}
}

func validateClickMouseInput(mode string, button string, input ClickMouseParams) error {
	switch mode {
	case "absolute":
		if button != "left" && button != "right" {
			return fmt.Errorf("absolute mouse clicks only support left and right buttons")
		}
		_, _, err := normalizedCoordinates(input.X, input.Y)
		return err
	case "relative":
		if input.X != nil || input.Y != nil {
			return fmt.Errorf("relative mouse clicks do not accept absolute coordinates")
		}
		if button != "left" && button != "right" && button != "middle" {
			return fmt.Errorf("relative mouse clicks only support left, right, and middle buttons")
		}
		return nil
	default:
		return fmt.Errorf("unknown mouse mode: %s", mode)
	}
}

func (e *toolExecutor) begin(ctx context.Context, kind inputcontrol.OperationKind) (context.Context, func(), error) {
	if ctx == nil {
		ctx = context.Background()
	}
	if e == nil {
		return ctx, func() {}, nil
	}

	var releaseMode func()
	if e.control != nil && kind == inputcontrol.OperationHID {
		var err error
		releaseMode, err = e.control.AcquireWrite(controlmode.ModeMCP)
		if err != nil {
			return nil, nil, fmt.Errorf("MCP service is disabled: %w", err)
		}
	}

	if e.coordinator == nil {
		return ctx, func() {
			if releaseMode != nil {
				releaseMode()
			}
		}, nil
	}

	operationCtx, releaseOperation, err := e.coordinator.BeginMCP(ctx, kind)
	if err != nil {
		if releaseMode != nil {
			releaseMode()
		}
		return nil, nil, err
	}
	return operationCtx, func() {
		releaseOperation()
		if releaseMode != nil {
			releaseMode()
		}
	}, nil
}

func typeTextSchema() *jsonschema.Schema {
	return objectSchema(map[string]*jsonschema.Schema{
		"text":    {Type: "string", Description: "Text to type on the remote host", MaxLength: jsonschema.Ptr(maxTypeTextRunes)},
		"delayMs": integerSchema(fmt.Sprintf("Delay between typed characters in milliseconds; defaults to %d when omitted, and 0 disables the delay", defaultTypeDelayMS), 0, 1000),
	}, "text")
}

func pressKeysSchema() *jsonschema.Schema {
	return objectSchema(map[string]*jsonschema.Schema{
		"keys": {
			Type:        "array",
			Description: "KeyboardEvent.code key names",
			Items:       &jsonschema.Schema{Type: "string", Enum: supportedKeyNames()},
			MinItems:    jsonschema.Ptr(1),
			MaxItems:    jsonschema.Ptr(maxPressKeyItems),
		},
		"holdMs": integerSchema(fmt.Sprintf("Hold time in milliseconds; defaults to %d when omitted, and 0 releases immediately", defaultHoldMS), 0, 1000),
	}, "keys")
}

func moveMouseSchema() *jsonschema.Schema {
	mode := &jsonschema.Schema{Type: "string", Enum: []any{"absolute", "relative"}}
	coordinate := func(description string) *jsonschema.Schema {
		return numberSchema(description, 0, 1)
	}
	schema := objectSchema(map[string]*jsonschema.Schema{
		"mode":   mode,
		"x":      coordinate("Absolute normalized x coordinate"),
		"y":      coordinate("Absolute normalized y coordinate"),
		"deltaX": integerSchema("Relative x movement", -maxRelativeMouseDelta, maxRelativeMouseDelta),
		"deltaY": integerSchema("Relative y movement", -maxRelativeMouseDelta, maxRelativeMouseDelta),
	})
	schema.OneOf = []*jsonschema.Schema{
		{
			Type:       "object",
			Properties: map[string]*jsonschema.Schema{"mode": {Type: "string", Enum: []any{"absolute"}}},
			Required:   []string{"x", "y"},
			Not: &jsonschema.Schema{AnyOf: []*jsonschema.Schema{
				{Type: "object", Required: []string{"deltaX"}},
				{Type: "object", Required: []string{"deltaY"}},
			}},
		},
		{
			Type:       "object",
			Properties: map[string]*jsonschema.Schema{"mode": {Type: "string", Enum: []any{"relative"}}},
			Required:   []string{"mode"},
			AnyOf: []*jsonschema.Schema{
				{Type: "object", Required: []string{"deltaX"}},
				{Type: "object", Required: []string{"deltaY"}},
			},
			Not: &jsonschema.Schema{AnyOf: []*jsonschema.Schema{
				{Type: "object", Required: []string{"x"}},
				{Type: "object", Required: []string{"y"}},
			}},
		},
	}
	return schema
}

func clickMouseSchema() *jsonschema.Schema {
	schema := objectSchema(map[string]*jsonschema.Schema{
		"button": {Type: "string", Enum: []any{"left", "right", "middle"}},
		"clicks": integerSchema("Number of clicks", 1, 5),
		"mode":   {Type: "string", Enum: []any{"absolute", "relative"}},
		"x":      numberSchema("Absolute normalized x coordinate", 0, 1),
		"y":      numberSchema("Absolute normalized y coordinate", 0, 1),
	})
	schema.OneOf = []*jsonschema.Schema{
		{
			Type: "object",
			Properties: map[string]*jsonschema.Schema{
				"mode":   {Type: "string", Enum: []any{"absolute"}},
				"button": {Type: "string", Enum: []any{"left", "right"}},
			},
			Required: []string{"mode", "x", "y"},
		},
		{
			Type: "object",
			Properties: map[string]*jsonschema.Schema{
				"mode":   {Type: "string", Enum: []any{"relative"}},
				"button": {Type: "string", Enum: []any{"left", "right", "middle"}},
			},
			Not: &jsonschema.Schema{AnyOf: []*jsonschema.Schema{
				{Type: "object", Required: []string{"x"}},
				{Type: "object", Required: []string{"y"}},
			}},
		},
	}
	return schema
}

func scrollMouseSchema() *jsonschema.Schema {
	return objectSchema(map[string]*jsonschema.Schema{
		"deltaY": integerSchema("Vertical wheel movement", -maxRelativeMouseDelta, maxRelativeMouseDelta),
	}, "deltaY")
}

func screenshotSchema() *jsonschema.Schema {
	return objectSchema(map[string]*jsonschema.Schema{
		"quality":   integerSchema("JPEG quality", 1, 100),
		"timeoutMs": integerSchema("Capture timeout in milliseconds", 0, 30000),
	})
}

func objectSchema(properties map[string]*jsonschema.Schema, required ...string) *jsonschema.Schema {
	return &jsonschema.Schema{
		Type:                 "object",
		Properties:           properties,
		Required:             required,
		AdditionalProperties: &jsonschema.Schema{Not: &jsonschema.Schema{}},
	}
}

func integerSchema(description string, minimum int, maximum int) *jsonschema.Schema {
	return &jsonschema.Schema{
		Type:        "integer",
		Description: description,
		Minimum:     jsonschema.Ptr(float64(minimum)),
		Maximum:     jsonschema.Ptr(float64(maximum)),
	}
}

func numberSchema(description string, minimum float64, maximum float64) *jsonschema.Schema {
	return &jsonschema.Schema{
		Type:        "number",
		Description: description,
		Minimum:     jsonschema.Ptr(minimum),
		Maximum:     jsonschema.Ptr(maximum),
	}
}

func toolError(message string) *protocol.CallToolResult {
	return &protocol.CallToolResult{
		Content: []protocol.Content{&protocol.TextContent{Text: message}},
		IsError: true,
	}
}

func normalizedMode(mode string, fallback string) string {
	normalized := strings.ToLower(strings.TrimSpace(mode))
	if normalized == "" {
		return fallback
	}
	return normalized
}

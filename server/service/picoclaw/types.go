package picoclaw

import (
	"encoding/json"
	"reflect"
	"strings"
	"sync"
	"time"

	"NanoKVM-Server/service/controlmode"

	"github.com/gorilla/websocket"
)

type VisionReader interface {
	ReadMjpeg(width uint16, height uint16, quality uint16) (data []byte, result int)
}

type HIDWriter interface {
	WriteHid0(data []byte)
	WriteHid1(data []byte)
	WriteHid2(data []byte)
}

type Service struct {
	vision             VisionReader
	hid                HIDWriter
	config             *ConfigStore
	lock               *SessionLock
	runtime            *RuntimeStore
	runtimeIntent      *RuntimeIntentStore
	control            *controlmode.Manager
	releaseHID         func() error
	operations         *controlOperationTracker
	runtimeLifecycleMu sync.Mutex
	reconcileOnce      sync.Once
}

type ConfigStore struct {
	mu     sync.RWMutex
	config Config
}

type RuntimeStore struct {
	mu     sync.RWMutex
	status RuntimeStatus
}

type RuntimeIntentStore struct {
	mu   sync.Mutex
	path string
}

type Config struct {
	GatewayURL       string `json:"gateway_url"`
	ConnectTimeoutMs int    `json:"connect_timeout_ms"`
	ReadTimeoutMs    int    `json:"read_timeout_ms"`
	WriteTimeoutMs   int    `json:"write_timeout_ms"`
	PingIntervalMs   int    `json:"ping_interval_ms"`
	MaxMessageBytes  int    `json:"max_message_bytes"`
	AllowTokenQuery  bool   `json:"allow_token_query"`
	Token            string `json:"token,omitempty"`
}

type RuntimeStatus struct {
	Ready           bool                `json:"ready"`
	Installed       bool                `json:"installed"`
	Installing      bool                `json:"installing"`
	InstallProgress int                 `json:"install_progress,omitempty"`
	InstallStage    string              `json:"install_stage,omitempty"`
	InstallPath     string              `json:"install_path,omitempty"`
	AgentProfile    string              `json:"agent_profile,omitempty"`
	ModelConfigured bool                `json:"model_configured"`
	ModelName       string              `json:"model_name,omitempty"`
	Status          string              `json:"status"`
	ConfigError     string              `json:"config_error,omitempty"`
	LastError       string              `json:"last_error,omitempty"`
	CheckedAt       time.Time           `json:"checked_at,omitempty"`
	CurrentSession  string              `json:"current_session,omitempty"`
	Restoring       bool                `json:"restoring,omitempty"`
	RuntimeIntent   RuntimeIntentStatus `json:"runtime_intent"`
	ControlMode     string              `json:"control_mode"`
	Transitioning   bool                `json:"transitioning,omitempty"`
	Control         ControlStatus       `json:"control"`
	Capabilities    RuntimeCapabilities `json:"capabilities"`
}

type RuntimeIntentStatus struct {
	DesiredRunning bool   `json:"desired_running"`
	UpdatedAt      string `json:"updated_at,omitempty"`
	UpdatedBy      string `json:"updated_by,omitempty"`
	LastStartedAt  string `json:"last_started_at,omitempty"`
	LastStoppedAt  string `json:"last_stopped_at,omitempty"`
	LastError      string `json:"last_error,omitempty"`
}

type ControlStatus struct {
	Mode          string    `json:"mode"`
	Transitioning bool      `json:"transitioning"`
	CanControl    bool      `json:"can_control"`
	LastError     string    `json:"last_error,omitempty"`
	ChangedAt     time.Time `json:"changed_at,omitempty"`
}

type RuntimeCapabilities struct {
	Chat          bool `json:"chat"`
	ReadOnlyTools bool `json:"read_only_tools"`
	DeviceWrite   bool `json:"device_write"`
}

type RuntimeStartResult struct {
	Started bool          `json:"started"`
	Command string        `json:"command"`
	Output  string        `json:"output,omitempty"`
	Status  RuntimeStatus `json:"status"`
}

type RuntimeInstallResult struct {
	Installed bool          `json:"installed"`
	Binary    string        `json:"binary"`
	Download  string        `json:"download"`
	Output    string        `json:"output,omitempty"`
	Status    RuntimeStatus `json:"status"`
}

type ScreenshotMeta struct {
	ImageBase64   string `json:"image_base64,omitempty"`
	SourceWidth   uint16 `json:"source_width"`
	SourceHeight  uint16 `json:"source_height"`
	CaptureWidth  uint16 `json:"capture_width"`
	CaptureHeight uint16 `json:"capture_height"`
	Format        string `json:"format"`
}

type ScreenshotQuery struct {
	Format  string `form:"format"`
	Width   uint16 `form:"width"`
	Height  uint16 `form:"height"`
	Quality uint16 `form:"quality"`
}

type Point struct {
	X *float64 `json:"x"`
	Y *float64 `json:"y"`
}

type HotkeyKeys []string

func (k *HotkeyKeys) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		*k = nil
		return nil
	}

	var list []string
	if err := json.Unmarshal(data, &list); err == nil {
		*k = normalizeHotkeyKeys(list)
		return nil
	}

	var csv string
	if err := json.Unmarshal(data, &csv); err == nil {
		if strings.TrimSpace(csv) == "" {
			*k = nil
			return nil
		}
		*k = normalizeHotkeyKeys(strings.Split(csv, ","))
		return nil
	}

	return &json.UnmarshalTypeError{Value: "keys", Type: hotkeyKeysType}
}

var hotkeyKeysType = reflect.TypeOf("")

func normalizeHotkeyKeys(input []string) HotkeyKeys {
	keys := make([]string, 0, len(input))
	for _, item := range input {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		keys = append(keys, trimmed)
	}
	return HotkeyKeys(keys)
}

type Action struct {
	Action     string     `json:"action"`
	X          *float64   `json:"x"`
	Y          *float64   `json:"y"`
	From       *Point     `json:"from"`
	To         *Point     `json:"to"`
	Button     string     `json:"button"`
	Text       string     `json:"text"`
	Keys       HotkeyKeys `json:"keys"`
	Direction  string     `json:"direction"`
	Amount     int        `json:"amount"`
	DurationMs int        `json:"duration_ms"`
}

type ActionBatch struct {
	Actions []Action `json:"actions"`
}

type ActionResult struct {
	Action          string `json:"action"`
	DurationMs      int64  `json:"duration_ms"`
	HIDWrites       int    `json:"hid_writes"`
	ExecutedActions int    `json:"executed_actions,omitempty"`
}

type cachedFrame struct {
	data       []byte
	width      uint16
	height     uint16
	capturedAt time.Time
}

type SessionState string

const (
	SessionStateCreated    SessionState = "created"
	SessionStateConnecting SessionState = "connecting"
	SessionStateActive     SessionState = "active"
	SessionStateClosing    SessionState = "closing"
	SessionStateClosed     SessionState = "closed"
)

const (
	CloseCodePicoclawLockHeld    = 4001
	CloseCodeRuntimeUnavailable  = 4002
	CloseCodeAuthFailed          = 4003
	CloseCodePicoclawTakenOver   = 4004
	CloseCodeUpstreamClosed      = 4005
	CloseCodeControlModeSwitched = 4006
	CloseCodeRuntimeStopped      = 4007
)

type GatewaySession struct {
	SessionID         string
	State             SessionState
	Downstream        *websocket.Conn
	Upstream          *websocket.Conn
	CreatedAt         time.Time
	UpdatedAt         time.Time
	closeOnce         sync.Once
	upstreamWriteMu   sync.Mutex
	downstreamWriteMu sync.Mutex
}

type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*GatewaySession
}

type LoadImageRequest struct {
	Path     string `json:"path"`
	Prompt   string `json:"prompt"`
	Filename string `json:"filename"`
}

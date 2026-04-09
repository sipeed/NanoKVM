package picoclaw

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// JSON-RPC 2.0 types for MCP HTTP transport

type jsonRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type jsonRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  interface{}     `json:"result,omitempty"`
	Error   *jsonRPCError   `json:"error,omitempty"`
}

type jsonRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// MCP tool definitions

var mcpToolDefinitions = []map[string]interface{}{
	{
		"name":        "kvm_screenshot",
		"description": "Capture the current HDMI frame from the downstream remote host as a base64-encoded JPEG image.",
		"inputSchema": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"width":   map[string]interface{}{"type": "integer", "description": "Target width in pixels (optional, default: 960)"},
				"height":  map[string]interface{}{"type": "integer", "description": "Target height in pixels (optional)"},
				"quality": map[string]interface{}{"type": "integer", "description": "JPEG quality 1-100 (optional, default: 60)"},
			},
		},
	},
	{
		"name":        "kvm_actions",
		"description": "Send one or more HID actions (click, type, hotkey, scroll, drag, move, wait) to the downstream remote host. Use normalized [0,1] coordinates for mouse actions.",
		"inputSchema": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"actions": map[string]interface{}{
					"type":        "array",
					"description": "Array of action objects. Each requires an 'action' field (click, move, type, hotkey, scroll, drag, wait).",
					"items": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"action":      map[string]interface{}{"type": "string"},
							"x":           map[string]interface{}{"type": "number"},
							"y":           map[string]interface{}{"type": "number"},
							"button":      map[string]interface{}{"type": "string"},
							"text":        map[string]interface{}{"type": "string"},
							"keys":        map[string]interface{}{"type": "array", "items": map[string]interface{}{"type": "string"}},
							"direction":   map[string]interface{}{"type": "string"},
							"amount":      map[string]interface{}{"type": "integer"},
							"duration_ms": map[string]interface{}{"type": "integer"},
							"from":        map[string]interface{}{"type": "object", "properties": map[string]interface{}{"x": map[string]interface{}{"type": "number"}, "y": map[string]interface{}{"type": "number"}}},
							"to":          map[string]interface{}{"type": "object", "properties": map[string]interface{}{"x": map[string]interface{}{"type": "number"}, "y": map[string]interface{}{"type": "number"}}},
						},
						"required": []string{"action"},
					},
				},
			},
			"required": []string{"actions"},
		},
	},
}

// MCPHandler handles MCP HTTP transport (JSON-RPC 2.0 over POST).
func (s *Service) MCPHandler(c *gin.Context) {
	var req jsonRPCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32700, Message: "parse error"},
		})
		return
	}

	if req.JSONRPC != "2.0" {
		c.JSON(http.StatusOK, jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32600, Message: "invalid request: jsonrpc must be 2.0"},
		})
		return
	}

	var resp jsonRPCResponse
	switch req.Method {
	case "initialize":
		resp = s.mcpInitialize(req)
	case "tools/list":
		resp = s.mcpToolsList(req)
	case "tools/call":
		resp = s.mcpToolsCall(req, c)
	case "ping":
		resp = jsonRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: map[string]interface{}{}}
	default:
		resp = jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32601, Message: fmt.Sprintf("method not found: %s", req.Method)},
		}
	}

	c.JSON(http.StatusOK, resp)
}

func (s *Service) mcpInitialize(req jsonRPCRequest) jsonRPCResponse {
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]interface{}{
				"tools": map[string]interface{}{},
			},
			"serverInfo": map[string]interface{}{
				"name":    "nanokvm",
				"version": "1.0.0",
			},
		},
	}
}

func (s *Service) mcpToolsList(req jsonRPCRequest) jsonRPCResponse {
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"tools": mcpToolDefinitions,
		},
	}
}

func (s *Service) mcpToolsCall(req jsonRPCRequest, c *gin.Context) jsonRPCResponse {
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &params); err != nil {
		return jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32602, Message: "invalid params"},
		}
	}

	switch params.Name {
	case "kvm_screenshot":
		return s.mcpScreenshot(req, params.Arguments)
	case "kvm_actions":
		return s.mcpActions(req, params.Arguments, c)
	default:
		return jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &jsonRPCError{Code: -32602, Message: fmt.Sprintf("unknown tool: %s", params.Name)},
		}
	}
}

func (s *Service) mcpScreenshot(req jsonRPCRequest, args json.RawMessage) jsonRPCResponse {
	var params struct {
		Width   uint16 `json:"width"`
		Height  uint16 `json:"height"`
		Quality uint16 `json:"quality"`
	}
	if args != nil {
		_ = json.Unmarshal(args, &params)
	}

	query := ScreenshotQuery{
		Format:  "base64",
		Width:   params.Width,
		Height:  params.Height,
		Quality: params.Quality,
	}

	data, meta, err := s.captureScreenshot(query)
	if err != nil {
		return mcpToolError(req, err.Message)
	}

	b64 := base64.StdEncoding.EncodeToString(data)
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": "screenshot captured",
				},
				{
					"type":     "image",
					"data":     b64,
					"mimeType": "image/jpeg",
				},
			},
			"meta": map[string]interface{}{
				"source_width":   meta.SourceWidth,
				"source_height":  meta.SourceHeight,
				"capture_width":  meta.CaptureWidth,
				"capture_height": meta.CaptureHeight,
			},
		},
	}
}

func (s *Service) mcpActions(req jsonRPCRequest, args json.RawMessage, c *gin.Context) jsonRPCResponse {
	var params struct {
		Actions []Action `json:"actions"`
	}
	if err := json.Unmarshal(args, &params); err != nil {
		return mcpToolError(req, "invalid actions payload")
	}
	if len(params.Actions) == 0 {
		return mcpToolError(req, "empty actions array")
	}

	sessionID := c.GetHeader(sessionIDHeader)
	if sessionID == "" {
		sessionID = s.lock.Owner()
	}

	result, err := s.executeActions(sessionID, params.Actions)
	if err != nil {
		return mcpToolError(req, err.Message)
	}

	resultJSON, _ := json.Marshal(result)
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": string(resultJSON),
				},
			},
		},
	}
}

func mcpToolError(req jsonRPCRequest, message string) jsonRPCResponse {
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"isError": true,
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": message,
				},
			},
		},
	}
}

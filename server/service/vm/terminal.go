package vm

import (
	"NanoKVM-Server/middleware"
	"encoding/json"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const (
	messageWait               = 10 * time.Second
	maxMessageSize            = 1024
	terminalHeartbeatType     = "ping"
	terminalHeartbeatResponse = `{"type":"pong"}`
)

type WinSize struct {
	Rows uint16 `json:"rows"`
	Cols uint16 `json:"cols"`
}

type terminalMessage struct {
	Type string `json:"type"`
	WinSize
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  maxMessageSize,
	WriteBufferSize: maxMessageSize,
	CheckOrigin:     middleware.CheckWebSocketOrigin,
}

func (s *Service) Terminal(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to init websocket: %s", err)
		return
	}
	stopSessionWatcher := middleware.WatchWebSocket(c.Request.Context(), ws)
	defer stopSessionWatcher()
	defer func() {
		_ = ws.Close()
	}()

	cmd := exec.Command("/bin/sh", "-l")
	cmd.Dir = "/root"
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Errorf("failed to start pty: %s", err)
		return
	}
	defer func() {
		_ = ptmx.Close()
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
	}()

	var writeMu sync.Mutex
	go wsWrite(ws, ptmx, &writeMu)
	wsRead(ws, ptmx, &writeMu)
}

func writeWsMessage(ws *websocket.Conn, writeMu *sync.Mutex, msgType int, data []byte) error {
	writeMu.Lock()
	defer writeMu.Unlock()

	_ = ws.SetWriteDeadline(time.Now().Add(messageWait))
	return ws.WriteMessage(msgType, data)
}

// pty to ws
func wsWrite(ws *websocket.Conn, ptmx *os.File, writeMu *sync.Mutex) {
	data := make([]byte, maxMessageSize)

	for {
		n, err := ptmx.Read(data)
		if err != nil {
			return
		}

		if n > 0 {
			err = writeWsMessage(ws, writeMu, websocket.BinaryMessage, data[:n])
			if err != nil {
				log.Errorf("write ws message failed: %s", err)
				return
			}
		}
	}
}

// ws to pty
func wsRead(ws *websocket.Conn, ptmx *os.File, writeMu *sync.Mutex) {
	var zeroTime time.Time
	_ = ws.SetReadDeadline(zeroTime)

	for {
		msgType, p, err := ws.ReadMessage()
		if err != nil {
			return
		}

		// control and resize messages
		if msgType == websocket.BinaryMessage {
			var message terminalMessage
			if err := json.Unmarshal(p, &message); err == nil {
				if message.Type == terminalHeartbeatType {
					if err := writeWsMessage(ws, writeMu, websocket.TextMessage, []byte(terminalHeartbeatResponse)); err != nil {
						log.Errorf("write terminal heartbeat failed: %s", err)
						return
					}
					continue
				}

				_ = pty.Setsize(ptmx, &pty.Winsize{
					Rows: message.Rows,
					Cols: message.Cols,
				})
			}
			continue
		}

		_, err = ptmx.Write(p)
		if err != nil {
			log.Errorf("failed to write to pty: %s", err)
			return
		}
	}
}

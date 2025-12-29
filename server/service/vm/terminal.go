package vm

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

const (
	messageWait    = 10 * time.Second
	maxMessageSize = 1024
)

type WinSize struct {
	Rows uint16 `json:"rows"`
	Cols uint16 `json:"cols"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  maxMessageSize,
	WriteBufferSize: maxMessageSize,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (s *Service) Terminal(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to init websocket: %s", err)
		return
	}
	defer func() {
		_ = ws.Close()
	}()

	cmd := exec.Command("/bin/sh")
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

	go wsWrite(ws, ptmx)
	wsRead(ws, ptmx)
}

// pty to ws
func wsWrite(ws *websocket.Conn, ptmx *os.File) {
	data := make([]byte, maxMessageSize)

	for {
		n, err := ptmx.Read(data)
		if err != nil {
			return
		}

		if n > 0 {
			_ = ws.SetWriteDeadline(time.Now().Add(messageWait))

			err = ws.WriteMessage(websocket.BinaryMessage, data[:n])
			if err != nil {
				log.Errorf("write ws message failed: %s", err)
				return
			}
		}
	}
}

// ws to pty
func wsRead(ws *websocket.Conn, ptmx *os.File) {
	var zeroTime time.Time
	_ = ws.SetReadDeadline(zeroTime)

	for {
		msgType, p, err := ws.ReadMessage()
		if err != nil {
			return
		}

		// resize message
		if msgType == websocket.BinaryMessage {
			var winSize WinSize
			if err := json.Unmarshal(p, &winSize); err == nil {
				_ = pty.Setsize(ptmx, &pty.Winsize{
					Rows: winSize.Rows,
					Cols: winSize.Cols,
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

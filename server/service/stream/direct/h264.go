package direct

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/common"
)

type Frame struct {
	IsKeyFrame bool   `json:"isKeyFrame"`
	Data       string `json:"data"`
	Timestamp  int64  `json:"timestamp"`
}

var (
	mutex    = sync.Mutex{}
	wsMap    = make(map[*websocket.Conn]bool)
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func Connect(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("failed to create websocket: %s", err)
		return
	}

	defer func() {
		_ = ws.Close()
		log.Debugf("h264 websocket disconnected")
	}()

	var zeroTime time.Time
	_ = ws.SetReadDeadline(zeroTime)

	mutex.Lock()
	wsMap[ws] = true
	if len(wsMap) == 1 {
		go send()
	}
	mutex.Unlock()

	_, _, err = ws.ReadMessage()
	if err != nil {
		mutex.Lock()
		delete(wsMap, ws)
		mutex.Unlock()
		log.Debugf("failed to read message: %s", err)
	}
}

func send() {
	screen := common.GetScreen()
	common.CheckScreen()

	fps := screen.FPS
	duration := time.Second / time.Duration(fps)

	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	vision := common.GetKvmVision()
	startTime := time.Now()

	for range ticker.C {
		if len(wsMap) == 0 {
			return
		}

		data, result := vision.ReadH264(screen.Width, screen.Height, screen.BitRate)
		if result < 0 {
			continue
		}

		frameMsg := Frame{
			IsKeyFrame: result == 3,
			Data:       base64.StdEncoding.EncodeToString(data),
			Timestamp:  time.Since(startTime).Microseconds(),
		}

		frameJSON, err := json.Marshal(frameMsg)
		if err != nil {
			continue
		}

		for ws := range wsMap {
			if err := ws.WriteMessage(websocket.TextMessage, frameJSON); err != nil {
				log.Debugf("failed to write message: %s", err)
			}
		}
	}
}

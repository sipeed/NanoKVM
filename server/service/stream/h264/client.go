package h264

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	log "github.com/sirupsen/logrus"
)

type Client struct {
	ws    *websocket.Conn
	pc    *webrtc.PeerConnection
	mutex sync.Mutex
}

type Message struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

// add video track
func (c *Client) addTrack() {
	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264},
		"video",
		"pion",
	)
	if err != nil {
		log.Errorf("failed to create video track: %s", err)
		return
	}

	_, err = c.pc.AddTrack(videoTrack)
	if err != nil {
		log.Errorf("failed to add video track: %s", err)
		return
	}

	trackMap[c.ws] = videoTrack
}

// register callback events
func (c *Client) register() {
	// new ICE candidate found
	c.pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		candidateByte, err := json.Marshal(candidate.ToJSON())
		if err != nil {
			log.Errorf("failed to marshal candidate: %s", err)
			return
		}

		_ = c.sendMessage("candidate", string(candidateByte))
	})

	// ICE connection state has changed
	c.pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		if state == webrtc.ICEConnectionStateConnected && !isSending {
			// start sending h264 data
			go send()
			isSending = true
		}

		log.Debugf("ice connection state has changed to %s", state.String())
	})
}

// read websocket message
func (c *Client) readMessage() {
	message := &Message{}

	for {
		_, raw, err := c.ws.ReadMessage()
		if err != nil {
			delete(trackMap, c.ws)
			if isSending && len(trackMap) == 0 {
				// stop sending when all websocket connections are closed
				isSending = false
			}

			log.Debugf("failed to read message: %s", err)
			return
		}

		if err := json.Unmarshal(raw, &message); err != nil {
			log.Errorf("failed to unmarshal message: %s", err)
			continue
		}

		log.Debugf("receive message event: %s", message.Event)

		switch message.Event {
		case "offer":
			offer := webrtc.SessionDescription{}
			if err := json.Unmarshal([]byte(message.Data), &offer); err != nil {
				log.Errorf("failed to unmarshal offer message: %s", err)
				return
			}

			if err := c.pc.SetRemoteDescription(offer); err != nil {
				log.Errorf("failed to set remote description: %s", err)
				return
			}

			answer, answerErr := c.pc.CreateAnswer(nil)
			if answerErr != nil {
				log.Errorf("failed to create answer: %s", answerErr)
				return
			}

			if err := c.pc.SetLocalDescription(answer); err != nil {
				log.Errorf("failed to set local description: %s", err)
				return
			}

			answerByte, answerByteErr := json.Marshal(answer)
			if answerByteErr != nil {
				log.Errorf("failed to marshal answer: %s", answerByteErr)
				return
			}

			_ = c.sendMessage("answer", string(answerByte))

		case "candidate":
			candidate := webrtc.ICECandidateInit{}
			if err := json.Unmarshal([]byte(message.Data), &candidate); err != nil {
				log.Errorf("failed to unmarshal candidate message: %s", err)
				return
			}

			if err := c.pc.AddICECandidate(candidate); err != nil {
				log.Errorf("failed to add ICE candidate: %s", err)
				return
			}

		case "heartbeat":
			_ = c.sendMessage("heartbeat", "")

		default:
			log.Debugf("unhandled message event: %s", message.Event)
		}
	}
}

// send websocket message
func (c *Client) sendMessage(event string, data string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	message := &Message{
		Event: event,
		Data:  data,
	}

	if err := c.ws.WriteJSON(message); err != nil {
		log.Errorf("failed to send message %s: %s", event, err)
		return err
	}

	log.Debugf("send message %s", message.Event)
	return nil
}

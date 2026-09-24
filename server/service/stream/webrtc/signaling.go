package webrtc

import (
	"encoding/json"
	"errors"

	"github.com/pion/webrtc/v4"
	log "github.com/sirupsen/logrus"
)

func NewSignalingHandler(client *Client) *SignalingHandler {
	return &SignalingHandler{
		client: client,
	}
}

// RegisterCallbacks Register callback functions
func (s *SignalingHandler) RegisterCallbacks() {
	// video ICE candidate
	s.client.video.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		candidateByte, err := json.Marshal(candidate.ToJSON())
		if err != nil {
			log.Errorf("failed to marshal video candidate: %s", err)
			return
		}

		if err := s.client.WriteMessage("video-candidate", string(candidateByte)); err != nil {
			log.Errorf("failed to send video candidate: %s", err)
		}
	})

	// video connection state change
	s.client.video.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		s.updateVideoStreamState(state)

		log.Debugf("video connection state changed to %s", state.String())
	})
}

func (s *SignalingHandler) Close() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.closed {
		return
	}

	s.closed = true
	if s.client != nil && s.client.WsConn() != nil {
		getManager().RemoveClient(s.client.WsConn())
	}
}

func (s *SignalingHandler) updateVideoStreamState(state webrtc.ICEConnectionState) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.closed {
		return
	}

	manager := getManager()
	if isVideoConnected(state) {
		if err := manager.AddClient(s.client.WsConn(), s.client); err != nil {
			if writeErr := s.client.WriteMessage("video-error", err.Error()); writeErr != nil {
				log.Errorf("failed to send video encoder conflict: %s", writeErr)
			}
			go s.client.Close()
			return
		}
		manager.StartVideoStream()
		return
	}

	manager.RemoveClient(s.client.WsConn())
}

func isVideoConnected(state webrtc.ICEConnectionState) bool {
	return state == webrtc.ICEConnectionStateConnected || state == webrtc.ICEConnectionStateCompleted
}

// HandleMessage handle the received message
func (s *SignalingHandler) HandleMessage(message *Message) error {
	switch message.Event {
	case "video-offer":
		return s.handleVideoOffer(message.Data)
	case "video-candidate":
		return s.handleVideoCandidate(message.Data)
	case "heartbeat":
		return s.handleHeartbeat()
	default:
		log.Debugf("Unhandled message event: %s", message.Event)
		return nil
	}
}

func (s *SignalingHandler) handleVideoOffer(data string) error {
	if s.client.video.SignalingState() != webrtc.SignalingStateStable {
		err := errors.New("video signaling is not stable")
		log.Error(err)
		return err
	}

	offer := webrtc.SessionDescription{}
	if err := json.Unmarshal([]byte(data), &offer); err != nil {
		log.Errorf("failed to unmarshal video offer: %s", err)
		return err
	}

	if err := s.client.video.SetRemoteDescription(offer); err != nil {
		log.Errorf("failed to set remote description: %s", err)
		return err
	}

	answer, err := s.client.video.CreateAnswer(nil)
	if err != nil {
		log.Errorf("failed to create answer: %s", err)
		return err
	}

	if err := s.client.video.SetLocalDescription(answer); err != nil {
		log.Errorf("failed to set local description: %s", err)
		return err
	}

	answerByte, err := json.Marshal(answer)
	if err != nil {
		log.Errorf("failed to marshal answer: %s", err)
		return err
	}

	return s.client.WriteMessage("video-answer", string(answerByte))
}

// handle video candidate
func (s *SignalingHandler) handleVideoCandidate(data string) error {
	candidate := webrtc.ICECandidateInit{}
	if err := json.Unmarshal([]byte(data), &candidate); err != nil {
		log.Errorf("failed to unmarshal candidate: %s", err)
		return err
	}

	if err := s.client.video.AddICECandidate(candidate); err != nil {
		log.Errorf("failed to add ICECandidate: %s", err)
		return err
	}

	return nil
}

// handle heartbeat
func (s *SignalingHandler) handleHeartbeat() error {
	return s.client.WriteMessage("heartbeat", "")
}

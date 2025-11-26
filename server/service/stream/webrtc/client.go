package webrtc

import (
	"encoding/json"
	"errors"

	"github.com/gorilla/websocket"
	"github.com/pion/rtp"
	"github.com/pion/rtp/codecs"
	"github.com/pion/webrtc/v4"
	log "github.com/sirupsen/logrus"

	"sync"
)

func NewClient(ws *websocket.Conn, videoConn *webrtc.PeerConnection) *Client {
	return &Client{
		ws:    ws,
		video: videoConn,
		mutex: sync.Mutex{},
	}
}

func (c *Client) WriteMessage(event string, data string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	message := &Message{
		Event: event,
		Data:  data,
	}

	if err := c.ws.WriteJSON(message); err != nil {
		log.Errorf("failed to send message %s: %v", event, err)
		return err
	}

	log.Debugf("sent message %s", event)
	return nil
}

func (c *Client) ReadMessage() (*Message, error) {
	_, raw, err := c.ws.ReadMessage()
	if err != nil {
		log.Errorf("failed to read message: %v", err)
		return nil, err
	}

	var message Message
	if err := json.Unmarshal(raw, &message); err != nil {
		log.Errorf("failed to unmarshal message: %v", err)
		return nil, nil
	}

	return &message, nil
}

func (c *Client) AddTrack() error {
	// video track
	videoTrack, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264},
		"video",
		"pion-video",
	)
	if err != nil {
		log.Errorf("failed to create video track: %s", err)
		return err
	}

	videoPacketizer := rtp.NewPacketizer(
		1200,
		100,
		0x1234ABCD,
		&codecs.H264Payloader{},
		rtp.NewRandomSequencer(),
		90000,
	)
	if videoPacketizer == nil {
		err := errors.New("failed to create rtp packetizer")
		log.Error(err)
		return err
	}

	videoSender, err := c.video.AddTrack(videoTrack)
	if err != nil {
		log.Errorf("failed to add video track: %s", err)
		return err
	}
	go startRTCPReader(videoSender)

	track := &Track{
		videoPacketizer: videoPacketizer,
		video:           videoTrack,
	}
	track.updateExtension()

	c.mutex.Lock()
	c.track = track
	c.mutex.Unlock()

	return nil
}

func startRTCPReader(sender *webrtc.RTPSender) {
	rtcpBuf := make([]byte, 1500)
	for {
		if _, _, err := sender.Read(rtcpBuf); err != nil {
			log.Debugf("RTCP reader error: %v", err)
			return
		}
	}
}

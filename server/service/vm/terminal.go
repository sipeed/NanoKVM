package vm

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"

	"NanoKVM-Server/utils"
)

const (
	messageWait    = 10 * time.Second
	maxMessageSize = 1024
)

type WindowSize struct {
	Height int `json:"height"`
	Width  int `json:"width"`
}

type SshClient struct {
	conn       *websocket.Conn
	addr       string
	user       string
	password   string
	client     *ssh.Client
	session    *ssh.Session
	sessionIn  io.WriteCloser
	sessionOut io.Reader
	closeSig   chan struct{}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  maxMessageSize,
	WriteBufferSize: maxMessageSize,
}

var terminalModes = ssh.TerminalModes{
	ssh.ECHO:          1,
	ssh.TTY_OP_ISPEED: 14400,
	ssh.TTY_OP_OSPEED: 14400,
}

func (s *SshClient) getWindowSize() (size *WindowSize, err error) {
	_ = s.conn.SetReadDeadline(time.Now().Add(messageWait))

	msgType, msg, err := s.conn.ReadMessage()
	if err != nil {
		log.Errorf("ws read message failed: %s", err)
		return
	}
	if msgType != websocket.BinaryMessage {
		log.Errorf("ws message type is not binary")
		return
	}

	size = new(WindowSize)
	if err = json.Unmarshal(msg, size); err != nil {
		log.Errorf("unmarshal ws message failed: %s", err)
		return
	}

	return
}

func (s *SshClient) wsWrite() error {
	defer func() {
		s.closeSig <- struct{}{}
	}()

	data := make([]byte, maxMessageSize)

	for {
		time.Sleep(10 * time.Millisecond)

		n, err := s.sessionOut.Read(data)
		if err != nil {
			return err
		}

		if n > 0 {
			_ = s.conn.SetWriteDeadline(time.Now().Add(messageWait))

			err = s.conn.WriteMessage(websocket.BinaryMessage, data[:n])
			if err != nil {
				log.Errorf("write ws message failed: %s", err)
				return err
			}
		}
	}
}

func (s *SshClient) wsRead() error {
	defer func() {
		s.closeSig <- struct{}{}
	}()

	var zeroTime time.Time
	_ = s.conn.SetReadDeadline(zeroTime)

	for {
		msgType, connReader, err := s.conn.NextReader()
		if err != nil {
			return err
		}
		if msgType != websocket.BinaryMessage {
			_, err = io.Copy(s.sessionIn, connReader)
			if err != nil {
				log.Errorf("copy ws message failed: %s", err)
				return err
			}
			continue
		}

		data := make([]byte, maxMessageSize)
		n, err := connReader.Read(data)
		if err != nil {
			log.Errorf("read ws message failed: %s", err)
			return err
		}

		var size WindowSize
		err = json.Unmarshal(data[:n], &size)
		if err != nil {
			log.Errorf("unmarshal ws message failed: %s", err)
			return err
		}

		err = s.session.WindowChange(size.Height, size.Width)
		if err != nil {
			log.Errorf("ws window change failed: %s", err)
			return err
		}
	}
}

func (s *SshClient) bridgeWSAndSSH() {
	defer func() {
		_ = s.conn.Close()
		if r := recover(); r != nil {
			log.Debugf("terminal recover: %s", r)
		}
	}()

	size, err := s.getWindowSize()
	if err != nil {
		return
	}

	auth := ssh.Password(s.password)
	config := &ssh.ClientConfig{
		User:            s.user,
		Auth:            []ssh.AuthMethod{auth},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	s.client, err = ssh.Dial("tcp", s.addr, config)
	if err != nil {
		// log.Errorf("init ssh failed: %s", err)
		return
	}
	defer func() {
		_ = s.client.Close()
	}()

	s.session, err = s.client.NewSession()
	if err != nil {
		log.Errorf("open ssh session failed: %s", err)
		return
	}
	defer s.session.Close()

	s.session.Stderr = os.Stderr
	s.sessionOut, err = s.session.StdoutPipe()
	if err != nil {
		log.Errorf("open ssh session out failed: %s", err)
		return
	}

	s.sessionIn, err = s.session.StdinPipe()
	if err != nil {
		log.Errorf("open ssh session in failed: %s", err)
		return
	}
	defer func() {
		_ = s.sessionIn.Close()
	}()

	if err = s.session.RequestPty("xterm", size.Height, size.Width, terminalModes); err != nil {
		log.Errorf("oen session request pty failed: %s", err)
		return
	}
	if err = s.session.Shell(); err != nil {
		log.Errorf("open ssh shell failed: %s", err)
		return
	}

	go func() {
		_ = s.wsRead()
	}()

	go func() {
		_ = s.wsWrite()
	}()

	<-s.closeSig
}

func getRootPassword() string {
	if !utils.IsAccountExist() {
		return "root"
	}

	account, err := utils.GetAccount()
	if err != nil {
		return "root"
	}

	if account == nil || account.Password == "" {
		return "root"
	}

	return account.Password
}

func (s *Service) Terminal(c *gin.Context) {
	user := c.Query("u")
	if user == "" {
		user = "root"
	}

	password, _ := utils.Decrypt(c.Query("t"))
	if password == "" {
		password = getRootPassword()
	}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Errorf("init websocket failed: %s", err)
		return
	}

	sshClient := &SshClient{
		conn:     conn,
		addr:     "127.0.0.1:22",
		user:     user,
		password: password,
		closeSig: make(chan struct{}, 1),
	}

	go sshClient.bridgeWSAndSSH()
}

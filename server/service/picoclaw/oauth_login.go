package picoclaw

import (
	"bufio"
	"context"
	"io"
	"os/exec"
	"regexp"
	"strings"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

// Device-code OAuth is driven entirely by the picoclaw binary's own native flow:
//
//	picoclaw auth login --provider openai --device-code
//
// picoclaw talks to auth.openai.com directly and stores the resulting tokens in
// its own credential store. NanoKVM only:
//   - parses the verification URL + user code the command prints, and shows them
//     in the web UI (the user authorizes in a browser on their own PC),
//   - stops ONLY the picoclaw runtime during login to cut peak memory, restarting
//     it afterwards (NanoKVM server, video, HID and KVM keep running),
//   - restores the previously-selected default model afterwards, because the
//     OpenAI login flips the default to gpt-5.4,
//   - records a non-secret "authenticated" hint.
//
// NanoKVM never reads, stores, or forwards the access/refresh tokens, and never
// imports the picoclaw Go module (it only execs the binary).

const (
	deviceCodeLoginTimeout = 15 * time.Minute
	deviceCodeURLWait      = 25 * time.Second
)

const (
	loginStatusIdle          = "idle"
	loginStatusPending       = "pending"
	loginStatusAuthenticated = "authenticated"
	loginStatusFailed        = "failed"
)

var (
	loginURLRegex  = regexp.MustCompile(`https?://[^\s"'<>]+`)
	loginCodeRegex = regexp.MustCompile(`\b[A-Z0-9]{4}-[A-Z0-9]{4}\b`)
	loginEmailRe   = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
)

type oauthLoginState struct {
	Provider  string
	Status    string
	LoginURL  string
	UserCode  string
	Account   string
	Error     string
	StartedAt time.Time
}

type oauthLoginManager struct {
	mu      sync.Mutex
	state   oauthLoginState
	running bool
	urlDone chan struct{}
}

var oauthLoginMgr = &oauthLoginManager{}

func (mgr *oauthLoginManager) snapshot() oauthLoginState {
	mgr.mu.Lock()
	defer mgr.mu.Unlock()
	return mgr.state
}

func (mgr *oauthLoginManager) observeLine(line string) {
	mgr.mu.Lock()
	defer mgr.mu.Unlock()
	if mgr.state.Status != loginStatusPending {
		return
	}

	if mgr.state.LoginURL == "" {
		if url := loginURLRegex.FindString(line); url != "" {
			mgr.state.LoginURL = strings.TrimRight(url, ".,)]}")
		}
	}
	if mgr.state.UserCode == "" {
		if code := loginCodeRegex.FindString(line); code != "" {
			mgr.state.UserCode = code
		}
	}
	if mgr.state.LoginURL != "" && mgr.urlDone != nil {
		select {
		case mgr.urlDone <- struct{}{}:
		default:
		}
	}
}

func (mgr *oauthLoginManager) finish(status, account, errMsg string) {
	mgr.mu.Lock()
	defer mgr.mu.Unlock()
	mgr.state.Status = status
	if account != "" {
		mgr.state.Account = account
	}
	mgr.state.Error = errMsg
	mgr.running = false
}

// startDeviceCodeLogin launches the picoclaw device-code login, returning the
// initial state (with the verification URL/code once parsed). The flow continues
// in the background until the user authorizes or it times out.
func (s *Service) startDeviceCodeLogin(provider string) oauthLoginState {
	mgr := oauthLoginMgr

	mgr.mu.Lock()
	if mgr.running {
		current := mgr.state
		mgr.mu.Unlock()
		return current
	}
	mgr.running = true
	mgr.state = oauthLoginState{Provider: provider, Status: loginStatusPending, StartedAt: time.Now()}
	mgr.urlDone = make(chan struct{}, 1)
	urlDone := mgr.urlDone
	mgr.mu.Unlock()

	// Remember what to put back after login completes.
	savedDefault := currentDefaultModelName()
	wasRunning := s.runtimeIsActive()
	if wasRunning {
		_, _, _ = s.stopRuntime()
	}

	ctx, cancel := context.WithTimeout(context.Background(), deviceCodeLoginTimeout)
	cmd := exec.CommandContext(ctx, picoclawBinaryPath, "auth", "login", "--provider", provider, "--device-code")

	stdout, outErr := cmd.StdoutPipe()
	stderr, errErr := cmd.StderrPipe()
	if outErr != nil || errErr != nil {
		cancel()
		mgr.finish(loginStatusFailed, "", "failed to capture picoclaw auth output")
		s.restoreAfterLogin(wasRunning, savedDefault)
		return mgr.snapshot()
	}

	if err := cmd.Start(); err != nil {
		cancel()
		mgr.finish(loginStatusFailed, "", "failed to start picoclaw auth login")
		s.restoreAfterLogin(wasRunning, savedDefault)
		return mgr.snapshot()
	}

	var collected strings.Builder
	var collectMu sync.Mutex
	scan := func(reader io.Reader) {
		scanner := bufio.NewScanner(reader)
		scanner.Buffer(make([]byte, 0, 64*1024), 256*1024)
		for scanner.Scan() {
			line := scanner.Text()
			collectMu.Lock()
			collected.WriteString(line)
			collected.WriteByte('\n')
			collectMu.Unlock()
			mgr.observeLine(line)
		}
	}
	var scanWg sync.WaitGroup
	scanWg.Add(2)
	go func() { defer scanWg.Done(); scan(stdout) }()
	go func() { defer scanWg.Done(); scan(stderr) }()

	go func() {
		waitErr := cmd.Wait()
		scanWg.Wait()
		cancel()

		collectMu.Lock()
		output := collected.String()
		collectMu.Unlock()

		if waitErr != nil {
			// Do not log the output verbatim; it may contain a token. Log only
			// the coarse failure.
			log.Warnf("[picoclaw oauth] device-code login failed for provider=%s", provider)
			mgr.finish(loginStatusFailed, "", "OAuth login did not complete")
		} else {
			account := loginEmailRe.FindString(output)
			mgr.finish(loginStatusAuthenticated, account, "")
			if err := setProviderOAuthState(provider, picoclawOAuthProviderState{
				Authenticated: true,
				Account:       account,
			}); err != nil {
				log.Warnf("[picoclaw oauth] failed to persist auth state: %v", err)
			}
		}
		s.restoreAfterLogin(wasRunning, savedDefault)
	}()

	select {
	case <-urlDone:
	case <-time.After(deviceCodeURLWait):
	}
	return mgr.snapshot()
}

// restoreAfterLogin puts the previously-selected default model back (the OpenAI
// login flips it to gpt-5.4) and restarts the picoclaw runtime if it had been
// running before login.
func (s *Service) restoreAfterLogin(wasRunning bool, savedDefault string) {
	if savedDefault != "" && currentDefaultModelName() != savedDefault {
		if err := restoreDefaultModelName(savedDefault); err != nil {
			log.Warnf("[picoclaw oauth] failed to restore default model: %v", err)
		}
	}
	if wasRunning {
		if _, _, err := s.startRuntime(); err != nil {
			log.Warnf("[picoclaw oauth] failed to restart runtime after login: %s", err.Message)
		}
	}
}

func (s *Service) runtimeIsActive() bool {
	status := s.runtime.Get()
	if status.Ready || status.Status == "ready" {
		return true
	}
	if running, err := isRuntimeRunning(); err == nil && running {
		return true
	}
	return false
}

func currentDefaultModelName() string {
	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return ""
	}
	return resolvePicoclawTargetModelName(doc.config)
}

func restoreDefaultModelName(modelName string) error {
	doc, err := loadPicoclawConfigDocument()
	if err != nil {
		return err
	}
	editor := &picoclawConfigEditor{raw: doc.raw}
	editor.setValue(modelName, "agents", "defaults", "model_name")
	if !editor.changed {
		return nil
	}
	return doc.saveConfig()
}

func clearDeviceCodeLogin() {
	mgr := oauthLoginMgr
	mgr.mu.Lock()
	defer mgr.mu.Unlock()
	if mgr.running {
		// A login is in flight; leave it alone.
		return
	}
	mgr.state = oauthLoginState{Status: loginStatusIdle}
}

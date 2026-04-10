package picoclaw

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	agentProfileDefault = "default"
	agentProfileKVM     = "kvm"
	agentProfileFile    = "AGENT.md"
)

type AgentProfileUpdateRequest struct {
	Profile string `json:"profile"`
}

func resolveAgentProfileSourcePath(profile string) (string, error) {
	fileName := agentProfileFile
	switch profile {
	case agentProfileDefault:
		fileName = "AGENT.md"
	case agentProfileKVM:
		fileName = "AGENT_KVM.md"
	default:
		return "", fmt.Errorf("unsupported agent profile: %s", profile)
	}

	candidates := make([]string, 0, 4)
	if wd, err := os.Getwd(); err == nil {
		candidates = append(candidates,
			filepath.Join(wd, "picoclaw", fileName),
			filepath.Join(wd, "docs", fileName),
		)
	}
	candidates = append(candidates,
		filepath.Join("/kvmapp", "picoclaw", fileName),
		filepath.Join(filepath.Dir(os.Args[0]), "..", "picoclaw", fileName),
	)

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("agent profile source not found: %s", fileName)
}

func detectPicoclawAgentProfile() string {
	workspacePath, err := resolvePicoclawWorkspacePath()
	if err != nil {
		return agentProfileKVM
	}

	targetPath := filepath.Join(workspacePath, agentProfileFile)
	targetContent, err := os.ReadFile(targetPath)
	if err != nil {
		return agentProfileKVM
	}

	switch parseAgentProfileName(string(targetContent)) {
	case "pico":
		return agentProfileDefault
	case "pico-kvm":
		return agentProfileKVM
	default:
		return agentProfileKVM
	}
}

func parseAgentProfileName(content string) string {
	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "name:") {
			continue
		}
		return strings.TrimSpace(strings.TrimPrefix(line, "name:"))
	}

	return ""
}

func applyPicoclawAgentProfile(profile string) error {
	sourcePath, err := resolveAgentProfileSourcePath(profile)
	if err != nil {
		return err
	}

	workspacePath, err := resolvePicoclawWorkspacePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(workspacePath, 0o755); err != nil {
		return fmt.Errorf("failed to create picoclaw workspace: %w", err)
	}

	sourceContent, err := os.ReadFile(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to read agent profile source: %w", err)
	}

	targetPath := filepath.Join(workspacePath, agentProfileFile)
	if err := os.WriteFile(targetPath, sourceContent, 0o644); err != nil {
		return fmt.Errorf("failed to write picoclaw AGENT.md: %w", err)
	}

	return nil
}

func withAgentProfile(status RuntimeStatus) RuntimeStatus {
	status.AgentProfile = detectPicoclawAgentProfile()
	return status
}

func (s *Service) UpdateAgentProfile(c *gin.Context) {
	var req AgentProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid agent profile payload"))
		return
	}

	profile := strings.TrimSpace(req.Profile)
	if profile != agentProfileDefault && profile != agentProfileKVM {
		writePicoclawError(c, newPicoclawError(CodeInvalidAction, "invalid agent profile"))
		return
	}

	if err := applyPicoclawAgentProfile(profile); err != nil {
		writePicoclawError(c, newPicoclawError(CodeRuntimeUnavailable, err.Error()))
		return
	}

	_ = s.syncConfigFromPicoclaw()
	_ = s.ensureRuntimeReady()

	writeSuccess(c, gin.H{
		"profile": profile,
		"status":  withAgentProfile(s.runtime.Get()),
	})
}

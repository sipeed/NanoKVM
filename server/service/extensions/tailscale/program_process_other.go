//go:build !linux

package tailscale

import "os/exec"

func configureProgramCommand(cmd *exec.Cmd) {}

func killProgramCommand(cmd *exec.Cmd) error {
	if cmd.Process == nil {
		return nil
	}
	return cmd.Process.Kill()
}

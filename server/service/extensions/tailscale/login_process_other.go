//go:build !linux

package tailscale

import "os/exec"

func configureLoginCommand(cmd *exec.Cmd) {}

func killLoginCommand(cmd *exec.Cmd) error {
	if cmd.Process == nil {
		return nil
	}
	return cmd.Process.Kill()
}

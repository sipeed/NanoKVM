//go:build linux

package tailscale

import (
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestRunProgramTimeoutKillsProcessGroup(t *testing.T) {
	started := time.Now()
	output, err := runProgramOutput(250*time.Millisecond, "sh", "-c", "sleep 30 & echo $!; wait")
	if err == nil || !strings.Contains(err.Error(), "timed out") {
		t.Fatalf("runProgramOutput error = %v, want timeout", err)
	}
	if elapsed := time.Since(started); elapsed > 3*time.Second {
		t.Fatalf("runProgramOutput returned after %s, process group was not bounded", elapsed)
	}

	pid, err := strconv.Atoi(strings.TrimSpace(output))
	if err != nil {
		t.Fatalf("background child PID in output %q: %v", output, err)
	}
	deadline := time.Now().Add(time.Second)
	for {
		state, statErr := os.ReadFile("/proc/" + strconv.Itoa(pid) + "/stat")
		if os.IsNotExist(statErr) || processTerminated(state) {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("background child %d survived command timeout", pid)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func processTerminated(stat []byte) bool {
	fields := strings.Fields(string(stat))
	return len(fields) > 2 && fields[2] == "Z"
}

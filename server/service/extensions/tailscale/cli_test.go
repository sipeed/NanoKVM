package tailscale

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestParseVersion(t *testing.T) {
	tests := []struct {
		name            string
		output          string
		requireUpstream bool
		current         string
		latest          string
		wantErr         bool
	}{
		{
			name:            "current and upstream",
			output:          `{"majorMinorPatch":"1.94.2","upstream":"1.102.3"}`,
			requireUpstream: true,
			current:         "1.94.2",
			latest:          "1.102.3",
		},
		{
			name:    "current only",
			output:  `{"majorMinorPatch":"1.102.3"}`,
			current: "1.102.3",
		},
		{
			name:            "warning before json",
			output:          "warning from platform integration\n{\"majorMinorPatch\":\"1.94.2\",\"upstream\":\"1.102.3\"}",
			requireUpstream: true,
			current:         "1.94.2",
			latest:          "1.102.3",
		},
		{
			name:    "invalid json",
			output:  "not json",
			wantErr: true,
		},
		{
			name:    "missing current",
			output:  `{"upstream":"1.102.3"}`,
			wantErr: true,
		},
		{
			name:            "missing required upstream",
			output:          `{"majorMinorPatch":"1.94.2"}`,
			requireUpstream: true,
			wantErr:         true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			version, err := parseVersion([]byte(tt.output), tt.requireUpstream)
			if tt.wantErr {
				if err == nil {
					t.Fatal("parseVersion() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("parseVersion() error = %v", err)
			}
			if version.Current != tt.current || version.Latest != tt.latest {
				t.Fatalf("parseVersion() = %+v, want current=%q latest=%q", version, tt.current, tt.latest)
			}
		})
	}
}

func TestCommandErrorLimitsOutput(t *testing.T) {
	err := commandError("update tailscale", []byte(strings.Repeat("x", 4096)), errors.New("failed"))
	if len(err.Error()) > 2100 {
		t.Fatalf("commandError() returned an unexpectedly long error: %d bytes", len(err.Error()))
	}
}

func TestWaitForDaemonState(t *testing.T) {
	checks := 0
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	err := waitForDaemonState(ctx, false, time.Millisecond, func() bool {
		checks++
		return checks < 3
	})
	if err != nil {
		t.Fatalf("waitForDaemonState() error = %v", err)
	}
	if checks != 3 {
		t.Fatalf("waitForDaemonState() checks = %d, want 3", checks)
	}
}

func TestWaitForDaemonStateTimeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	err := waitForDaemonState(ctx, false, time.Millisecond, func() bool { return true })
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("waitForDaemonState() error = %v, want deadline exceeded", err)
	}
}

func TestRestartAfterUpdateWaitsBetweenStopAndStart(t *testing.T) {
	running := true
	stopCalls := 0
	startCalls := 0
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	err := restartAfterUpdate(
		ctx,
		func() error {
			stopCalls++
			running = false
			return nil
		},
		func() error {
			startCalls++
			if running {
				t.Fatal("start called while old daemon was still running")
			}
			running = true
			return nil
		},
		func() bool { return running },
	)
	if err != nil {
		t.Fatalf("restartAfterUpdate() error = %v", err)
	}
	if stopCalls != 1 || startCalls != 1 {
		t.Fatalf("restartAfterUpdate() stop calls = %d, start calls = %d; want 1, 1", stopCalls, startCalls)
	}
}

func TestRestartAfterUpdateDoesNotStartOnStopTimeout(t *testing.T) {
	startCalls := 0
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	err := restartAfterUpdate(
		ctx,
		func() error { return nil },
		func() error {
			startCalls++
			return nil
		},
		func() bool { return true },
	)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("restartAfterUpdate() error = %v, want deadline exceeded", err)
	}
	if startCalls != 0 {
		t.Fatalf("restartAfterUpdate() start calls = %d, want 0", startCalls)
	}
}

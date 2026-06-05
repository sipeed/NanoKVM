package storage

import (
	"fmt"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func withDataDiskPaths(t *testing.T) (marker string, pending string, part string) {
	t.Helper()

	oldMarker := dataDiskMarkerPath
	oldPending := formatPendingPath
	oldPart := dataPartitionPath
	oldImageNone := imageNone

	dir := t.TempDir()
	marker = filepath.Join(dir, "kvm.disk0")
	pending = filepath.Join(dir, "kvm.disk0.formatting")
	part = filepath.Join(dir, "mmcblk0p3")

	dataDiskMarkerPath = marker
	formatPendingPath = pending
	dataPartitionPath = part
	imageNone = part

	t.Cleanup(func() {
		dataDiskMarkerPath = oldMarker
		formatPendingPath = oldPending
		dataPartitionPath = oldPart
		imageNone = oldImageNone
	})

	return marker, pending, part
}

func touch(t *testing.T, path string) {
	t.Helper()
	if err := os.WriteFile(path, nil, 0o600); err != nil {
		t.Fatalf("touch %s: %v", path, err)
	}
}

func TestMountImagePathDefaultDataDisk(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(t *testing.T, marker, pending, part string)
		requested string
		wantImage string
		wantOK    bool
	}{
		{
			name:      "empty request clears backing without data disk readiness",
			wantImage: "",
			wantOK:    true,
		},
		{
			name: "explicit data partition allowed when ready",
			setup: func(t *testing.T, marker, _pending, part string) {
				touch(t, marker)
				touch(t, part)
			},
			requested: "DATA_PART",
			wantImage: "DATA_PART",
			wantOK:    true,
		},
		{
			name: "explicit data partition with whitespace allowed when ready",
			setup: func(t *testing.T, marker, _pending, part string) {
				touch(t, marker)
				touch(t, part)
			},
			requested: " WHITESPACE_DATA_PART ",
			wantImage: "DATA_PART",
			wantOK:    true,
		},
		{
			name: "explicit data partition blocked without ready marker",
			setup: func(t *testing.T, _marker, _pending, part string) {
				touch(t, part)
			},
			requested: "DATA_PART",
			wantOK:    false,
		},
		{
			name: "explicit data partition with whitespace blocked without ready marker",
			setup: func(t *testing.T, _marker, _pending, part string) {
				touch(t, part)
			},
			requested: " WHITESPACE_DATA_PART ",
			wantOK:    false,
		},
		{
			name: "explicit data partition blocked while format pending",
			setup: func(t *testing.T, marker, pending, part string) {
				touch(t, marker)
				touch(t, pending)
				touch(t, part)
			},
			requested: "DATA_PART",
			wantOK:    false,
		},
		{
			name: "explicit data partition with whitespace blocked while format pending",
			setup: func(t *testing.T, marker, pending, part string) {
				touch(t, marker)
				touch(t, pending)
				touch(t, part)
			},
			requested: " WHITESPACE_DATA_PART ",
			wantOK:    false,
		},
		{
			name: "explicit data partition blocked when partition missing",
			setup: func(t *testing.T, marker, _pending, _part string) {
				touch(t, marker)
			},
			requested: "DATA_PART",
			wantOK:    false,
		},
		{
			name:      "custom image allowed without data disk readiness",
			requested: "/data/custom.iso",
			wantImage: "/data/custom.iso",
			wantOK:    true,
		},
		{
			name:      "custom image path is trimmed",
			requested: "  /data/custom.iso  ",
			wantImage: "/data/custom.iso",
			wantOK:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			marker, pending, part := withDataDiskPaths(t)
			if tt.setup != nil {
				tt.setup(t, marker, pending, part)
			}

			requested := tt.requested
			if requested == "DATA_PART" {
				requested = part
			}
			if requested == " WHITESPACE_DATA_PART " {
				requested = "  " + part + "  "
			}

			got, ok := mountImagePath(requested)
			if ok != tt.wantOK {
				t.Fatalf("ok = %v, want %v", ok, tt.wantOK)
			}
			if !ok {
				return
			}

			want := tt.wantImage
			if want == "DATA_PART" {
				want = part
			}
			if got != want {
				t.Fatalf("image = %q, want %q", got, want)
			}
		})
	}
}

func TestMountImageDefaultDataDiskNotReadyHasNoSideEffects(t *testing.T) {
	gin.SetMode(gin.TestMode)
	withDataDiskPaths(t)

	oldMountDevice := mountDevice
	oldRoFlag := roFlag
	oldCdromFlag := cdromFlag
	oldInquiryString := inquiryString

	dir := t.TempDir()
	mountDevice = filepath.Join(dir, "file")
	roFlag = filepath.Join(dir, "ro")
	cdromFlag = filepath.Join(dir, "cdrom")
	inquiryString = filepath.Join(dir, "inquiry")

	t.Cleanup(func() {
		mountDevice = oldMountDevice
		roFlag = oldRoFlag
		cdromFlag = oldCdromFlag
		inquiryString = oldInquiryString
	})

	writeFile := func(path, content string) {
		t.Helper()
		if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	readFile := func(path string) string {
		t.Helper()
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		return string(content)
	}

	writeFile(mountDevice, "/data/current.iso")
	writeFile(roFlag, "1")
	writeFile(cdromFlag, "1")
	writeFile(inquiryString, "old inquiry")

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(fmt.Sprintf(`{"file":%q}`, dataPartitionPath)))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if !strings.Contains(response.Body.String(), "data disk is not ready") {
		t.Fatalf("response = %s, want data disk readiness error", response.Body.String())
	}
	if got := readFile(mountDevice); got != "/data/current.iso" {
		t.Fatalf("mountDevice = %q, want unchanged current image", got)
	}
	if got := readFile(roFlag); got != "1" {
		t.Fatalf("roFlag = %q, want unchanged", got)
	}
	if got := readFile(cdromFlag); got != "1" {
		t.Fatalf("cdromFlag = %q, want unchanged", got)
	}
	if got := readFile(inquiryString); got != "old inquiry" {
		t.Fatalf("inquiryString = %q, want unchanged", got)
	}
}

func TestMountImageEmptyRequestClearsCurrentImageWhenDataDiskNotReady(t *testing.T) {
	gin.SetMode(gin.TestMode)
	withDataDiskPaths(t)

	oldMountDevice := mountDevice
	oldRoFlag := roFlag
	oldCdromFlag := cdromFlag
	oldInquiryString := inquiryString

	dir := t.TempDir()
	mountDevice = filepath.Join(dir, "file")
	roFlag = filepath.Join(dir, "ro")
	cdromFlag = filepath.Join(dir, "cdrom")
	inquiryString = filepath.Join(dir, "inquiry")

	t.Cleanup(func() {
		mountDevice = oldMountDevice
		roFlag = oldRoFlag
		cdromFlag = oldCdromFlag
		inquiryString = oldInquiryString
	})

	writeFile := func(path, content string) {
		t.Helper()
		if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	readFile := func(path string) string {
		t.Helper()
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		return string(content)
	}

	writeFile(mountDevice, "/data/current.iso")
	writeFile(roFlag, "1")
	writeFile(cdromFlag, "1")
	writeFile(inquiryString, "old inquiry")

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(`{"file":""}`))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if strings.Contains(response.Body.String(), "data disk is not ready") {
		t.Fatalf("response = %s, should allow empty unmount request", response.Body.String())
	}
	if got := readFile(mountDevice); got != "" {
		t.Fatalf("mountDevice = %q, want cleared backing file", got)
	}
	if got := readFile(roFlag); got != "0" {
		t.Fatalf("roFlag = %q, want reset", got)
	}
	if got := readFile(cdromFlag); got != "0" {
		t.Fatalf("cdromFlag = %q, want reset", got)
	}
}

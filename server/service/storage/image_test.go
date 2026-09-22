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
	oldVirtualDisk := virtualDiskPath
	oldMounted := dataDirectoryMount
	oldRunCommand := runShellCommand

	dir := t.TempDir()
	marker = filepath.Join(dir, "kvm.disk0")
	pending = filepath.Join(dir, "kvm.disk0.formatting")
	part = filepath.Join(dir, "mmcblk0p3")

	dataDiskMarkerPath = marker
	formatPendingPath = pending
	dataPartitionPath = part
	virtualDiskPath = filepath.Join(dir, "usb.disk0")
	dataDirectoryMount = func(string) bool { return true }
	runShellCommand = func(string) error { return nil }

	t.Cleanup(func() {
		dataDiskMarkerPath = oldMarker
		formatPendingPath = oldPending
		dataPartitionPath = oldPart
		virtualDiskPath = oldVirtualDisk
		dataDirectoryMount = oldMounted
		runShellCommand = oldRunCommand
	})

	return marker, pending, part
}

func touch(t *testing.T, path string) {
	t.Helper()
	if err := os.WriteFile(path, nil, 0o600); err != nil {
		t.Fatalf("touch %s: %v", path, err)
	}
}

func readText(t *testing.T, path string) string {
	t.Helper()
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return string(content)
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
			name: "explicit data partition always requires virtual disk toggle",
			setup: func(t *testing.T, marker, _pending, part string) {
				touch(t, marker)
				touch(t, part)
			},
			requested: "DATA_PART",
			wantOK:    false,
		},
		{
			name: "whitespace data partition always requires virtual disk toggle",
			setup: func(t *testing.T, marker, _pending, part string) {
				touch(t, marker)
				touch(t, part)
			},
			requested: " WHITESPACE_DATA_PART ",
			wantOK:    false,
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

func TestMountImagePathRejectsAliasToDataPartition(t *testing.T) {
	_, _, part := withDataDiskPaths(t)
	touch(t, part)

	alias := filepath.Join(t.TempDir(), "data-alias")
	if err := os.Symlink(part, alias); err != nil {
		t.Fatal(err)
	}

	if _, ok := mountImagePath(alias); ok {
		t.Fatalf("mountImagePath(%q) allowed an alias of the data partition", alias)
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

	if !strings.Contains(response.Body.String(), `"code":0`) {
		t.Fatalf("response = %s, want success", response.Body.String())
	}
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

func TestMountImageEmptyRequestRestoresReadyDefaultBacking(t *testing.T) {
	gin.SetMode(gin.TestMode)
	_, _, part := withDataDiskPaths(t)
	dataDirectoryMount = func(string) bool { return false }
	touch(t, part)
	touch(t, dataDiskMarkerPath)
	touch(t, virtualDiskPath)

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

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(`{"file":""}`))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if !strings.Contains(response.Body.String(), `"code":0`) {
		t.Fatalf("response = %s, want success", response.Body.String())
	}
	if got := readText(t, mountDevice); got != part {
		t.Fatalf("mountDevice = %q, want default partition %q", got, part)
	}
	if got := readText(t, roFlag); got != "0" {
		t.Fatalf("roFlag = %q, want reset", got)
	}
	if got := readText(t, cdromFlag); got != "0" {
		t.Fatalf("cdromFlag = %q, want reset", got)
	}
}

func TestMountImageEmptyRequestDoesNotExposeMountedDefaultBacking(t *testing.T) {
	gin.SetMode(gin.TestMode)
	_, _, part := withDataDiskPaths(t)
	touch(t, part)
	touch(t, dataDiskMarkerPath)
	touch(t, virtualDiskPath)

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

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(`{"file":""}`))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if !strings.Contains(response.Body.String(), `"code":0`) {
		t.Fatalf("response = %s, want success", response.Body.String())
	}
	if got := readText(t, mountDevice); got != "" {
		t.Fatalf("mountDevice = %q, want mounted data disk left detached", got)
	}
}

func TestMountImageWhitespaceRequestResetsFlags(t *testing.T) {
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

	if err := os.WriteFile(roFlag, []byte("1"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(cdromFlag, []byte("1"), 0o600); err != nil {
		t.Fatal(err)
	}

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(`{"file":"   "}`))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if !strings.Contains(response.Body.String(), `"code":0`) {
		t.Fatalf("response = %s, want success", response.Body.String())
	}
	if got := readText(t, roFlag); got != "0" {
		t.Fatalf("roFlag = %q, want reset", got)
	}
	if got := readText(t, cdromFlag); got != "0" {
		t.Fatalf("cdromFlag = %q, want reset", got)
	}
}

func TestMountImageDataPathRequiresMountedDataDisk(t *testing.T) {
	gin.SetMode(gin.TestMode)
	withDataDiskPaths(t)
	dataDirectoryMount = func(string) bool { return false }

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest("POST", "/storage/image/mount", strings.NewReader(`{"file":"/data/custom.iso"}`))
	context.Request.Header.Set("Content-Type", "application/json")

	NewService().MountImage(context)

	if !strings.Contains(response.Body.String(), "data disk is not mounted") {
		t.Fatalf("response = %s, want data mount error", response.Body.String())
	}
}

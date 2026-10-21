package storage

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDeleteGuard(t *testing.T) {
	const attached = "/data/images/win.iso"
	mounted := []string{"/data/share/disk.img"}

	tests := []struct {
		target string
		want   error
	}{
		{"/data/images/win.iso", errMediumAttached},
		{"/data/IMAGES/WIN.ISO", errMediumAttached},
		{"/data/images", errMediumAttached},
		{"/data/IMAGES", errMediumAttached},
		{"/data/Images/", errMediumAttached},
		{"/data/share/disk.img", errMediumBusy},
		{"/data/Share", errMediumBusy},
		{"/data/images/win.iso.bak", nil},
		{"/data/imagesold", nil},
		{"/data/share/other.img", nil},
	}

	for _, tt := range tests {
		if got := deleteGuard(tt.target, attached, mounted); !errors.Is(got, tt.want) || (got == nil) != (tt.want == nil) {
			t.Errorf("deleteGuard(%q) = %v, want %v", tt.target, got, tt.want)
		}
	}

	if err := deleteGuard("/data/images", "", nil); err != nil {
		t.Errorf("deleteGuard with nothing attached = %v, want nil", err)
	}
	// The raw partition is served by device path, which no file under /data
	// can match.
	if err := deleteGuard("/data/images", partitionDevice, nil); err != nil {
		t.Errorf("deleteGuard with the partition attached = %v, want nil", err)
	}
}

func TestPathWithinRelative(t *testing.T) {
	// The running upload's target is medium relative, like a delete request.
	if !pathWithin("dir/sub/file.bin", "dir") || !pathWithin("DIR/file.bin", "dir") {
		t.Error("an upload below the directory was not matched")
	}
	if pathWithin("dir2/file.bin", "dir") {
		t.Error("a sibling with a common prefix was matched")
	}
}

func TestAbandonWaiterHandsTurnOn(t *testing.T) {
	s := &Service{jobState: jobStateIdle}

	done, err := s.beginJob(context.Background(), "a")
	if err != nil {
		t.Fatal(err)
	}

	first := make(chan struct{})
	second := make(chan struct{})
	s.jobWaiters = []chan struct{}{first, second}

	// The slot goes to the first waiter, whose client is already gone.
	s.finishJob(done, jobStateSuccess, "")
	assertClosed(t, first, "first waiter")
	assertOpen(t, second, "second waiter before the abandon")

	s.abandonWaiter(first)
	assertClosed(t, second, "second waiter")
	if len(s.jobWaiters) != 0 {
		t.Errorf("queue holds %d waiters, want 0", len(s.jobWaiters))
	}
	if activeJobs.Load() != 0 {
		t.Errorf("activeJobs = %d, want 0", activeJobs.Load())
	}
}

func TestAbandonQueuedWaiterLeavesOthers(t *testing.T) {
	s := &Service{jobState: jobStateIdle}

	done, err := s.beginJob(context.Background(), "a")
	if err != nil {
		t.Fatal(err)
	}
	defer s.finishJob(done, jobStateSuccess, "")

	first := make(chan struct{})
	second := make(chan struct{})
	s.jobWaiters = []chan struct{}{first, second}

	s.abandonWaiter(first)
	assertOpen(t, second, "second waiter")
	if len(s.jobWaiters) != 1 || s.jobWaiters[0] != second {
		t.Errorf("queue = %v, want only the second waiter", s.jobWaiters)
	}
}

func assertClosed(t *testing.T, ch chan struct{}, what string) {
	t.Helper()
	select {
	case <-ch:
	default:
		t.Errorf("%s was not woken", what)
	}
}

func assertOpen(t *testing.T, ch chan struct{}, what string) {
	t.Helper()
	select {
	case <-ch:
		t.Errorf("%s was woken", what)
	default:
	}
}

func TestDropCachesValues(t *testing.T) {
	// The 5.10 sysctl refuses anything outside 1..4.
	for _, value := range []string{dropCachesQuiet, dropCachesDentry, dropCachesAllData} {
		if len(value) != 1 || value[0] < '1' || value[0] > '4' {
			t.Errorf("drop_caches value %q is outside 1..4", value)
		}
	}
}

func TestRFC5987Encode(t *testing.T) {
	tests := map[string]string{
		"ubuntu-24.04.iso": "ubuntu-24.04.iso",
		"a b=c:d@e;f,g'h":  "a%20b%3Dc%3Ad%40e%3Bf%2Cg%27h",
		"!#$&+-.^_`|~":     "!#$&+-.^_`|~",
		"中.txt":            "%E4%B8%AD.txt",
		"100%\"x\\y/z":     "100%25%22x%5Cy%2Fz",
	}
	for in, want := range tests {
		if got := rfc5987Encode(in); got != want {
			t.Errorf("rfc5987Encode(%q) = %q, want %q", in, got, want)
		}
	}

	header := attachmentHeader(`中 "a".iso`)
	if !strings.HasPrefix(header, `attachment; filename="_ _a_.iso"; filename*=UTF-8''`) {
		t.Errorf("attachmentHeader = %q", header)
	}
}

func TestHoldsMedia(t *testing.T) {
	root := t.TempDir()
	mustWrite := func(rel string) {
		full := filepath.Join(root, rel)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, nil, 0o644); err != nil {
			t.Fatal(err)
		}
	}
	mustWrite("images/win.ISO")
	mustWrite("share/notes.txt")
	mustWrite("share/deep/disk.img")
	mustWrite("docs/readme.txt")

	cases := map[string]bool{
		"images":              true,
		"images/win.ISO":      true,
		"share":               true,
		"share/notes.txt":     false,
		"docs":                false,
		"missing/new.iso":     true,
		"missing/notes.txt":   false,
		"share/deep/disk.img": true,
	}
	for rel, want := range cases {
		got, err := holdsMedia(filepath.Join(root, rel))
		if err != nil {
			t.Fatalf("holdsMedia(%s): %v", rel, err)
		}
		if got != want {
			t.Errorf("holdsMedia(%s) = %v, want %v", rel, got, want)
		}
	}
}

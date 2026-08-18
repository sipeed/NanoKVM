package utils

import "testing"

func TestSecureJoinAcceptsPlainName(t *testing.T) {
	path, err := SecureJoin("/etc/kvm/scripts", "backup.sh")
	if err != nil {
		t.Fatalf("plain name should be accepted: %s", err)
	}
	if path != "/etc/kvm/scripts/backup.sh" {
		t.Fatalf("unexpected path %q", path)
	}
}

func TestSecureJoinRejectsEmptyName(t *testing.T) {
	if _, err := SecureJoin("/etc/kvm/scripts", ""); err == nil {
		t.Fatal("empty name must be rejected")
	}
}

func TestSecureJoinRejectsTraversal(t *testing.T) {
	for _, name := range []string{"..", "../pwd", "../../etc/passwd", "sub/dir.sh"} {
		if _, err := SecureJoin("/etc/kvm/scripts", name); err == nil {
			t.Fatalf("name %q must be rejected", name)
		}
	}
}

func TestSecureJoinRejectsShellMetacharacters(t *testing.T) {
	// These names are safe as file paths but become command injection once the
	// result is handed to sh -c.
	for _, name := range []string{"a.sh; reboot", "a.sh&&reboot", "a.sh`reboot`", "a.sh$(reboot)", "a|b.sh"} {
		if _, err := SecureJoin("/etc/kvm/scripts", name); err == nil {
			t.Fatalf("name %q must be rejected", name)
		}
	}
}

func TestSecureJoinAcceptsNameWithSpace(t *testing.T) {
	// A space is safe: the name reaches the interpreter as one argument, never
	// as shell text, and it is a common way to name an uploaded script.
	path, err := SecureJoin("/etc/kvm/scripts", "nightly backup.sh")
	if err != nil {
		t.Fatalf("a name with a space should be accepted: %s", err)
	}
	if path != "/etc/kvm/scripts/nightly backup.sh" {
		t.Fatalf("unexpected path %q", path)
	}
}

func TestSecureJoinRejectsLeadingSpace(t *testing.T) {
	if _, err := SecureJoin("/etc/kvm/scripts", " a.sh"); err == nil {
		t.Fatal("a name starting with a space must be rejected")
	}
}

func TestSecureJoinRejectsHiddenAndAbsoluteNames(t *testing.T) {
	for _, name := range []string{"/etc/passwd", ".hidden"} {
		if _, err := SecureJoin("/etc/kvm/scripts", name); err == nil {
			t.Fatalf("name %q must be rejected", name)
		}
	}
}

func TestIsPathInsideAcceptsChild(t *testing.T) {
	if !IsPathInside("/data", "/data/ubuntu.iso") {
		t.Fatal("a file in the directory must be accepted")
	}
}

func TestIsPathInsideAcceptsNestedChild(t *testing.T) {
	if !IsPathInside("/data", "/data/isos/ubuntu.iso") {
		t.Fatal("a file in a subdirectory must be accepted")
	}
}

func TestIsPathInsideRejectsTraversal(t *testing.T) {
	// The old DeleteImage check compared a lowercased copy with HasPrefix, so
	// this escaped while still looking like it was under /data.
	if IsPathInside("/data", "/data/../root/secret.iso") {
		t.Fatal("traversal out of the directory must be rejected")
	}
}

func TestIsPathInsideRejectsSiblingWithSharedPrefix(t *testing.T) {
	if IsPathInside("/data", "/database/x.iso") {
		t.Fatal("a sibling directory sharing a prefix must be rejected")
	}
}

func TestIsPathInsideRejectsTheDirectoryItself(t *testing.T) {
	if IsPathInside("/data", "/data") {
		t.Fatal("the directory itself is not a file inside it")
	}
}

func TestIsPathInsideRejectsRelativePath(t *testing.T) {
	if IsPathInside("/data", "ubuntu.iso") {
		t.Fatal("a relative path must be rejected")
	}
}

func TestIsPathInsideRejectsRelativeDirectory(t *testing.T) {
	// A caller that passes a relative directory has not established what the
	// path is measured against, so the answer cannot be "contained".
	if IsPathInside("data", "/data/ubuntu.iso") {
		t.Fatal("a relative directory must be rejected")
	}
}

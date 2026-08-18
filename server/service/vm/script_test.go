package vm

import (
	"strings"
	"testing"
)

func TestScriptCommandRunsShellScriptsThroughSh(t *testing.T) {
	// "sh -c <path>" used to interpret a shell script that has no shebang.
	// Executing the path directly would fail those scripts with ENOEXEC, so
	// the interpreter has to stay in the command.
	cmd := scriptCommand("backup.sh", "/etc/kvm/scripts/backup.sh")

	if len(cmd.Args) != 2 || cmd.Args[0] != "sh" || cmd.Args[1] != "/etc/kvm/scripts/backup.sh" {
		t.Fatalf("args are %q, want [sh /etc/kvm/scripts/backup.sh]", cmd.Args)
	}
}

func TestScriptCommandRunsPythonScriptsThroughPython(t *testing.T) {
	cmd := scriptCommand("report.PY", "/etc/kvm/scripts/report.PY")

	if len(cmd.Args) != 2 || cmd.Args[0] != "python" {
		t.Fatalf("args are %q, want python first", cmd.Args)
	}
}

func TestScriptCommandNeverPassesTheNameToAShell(t *testing.T) {
	// SecureJoin rejects these names before they reach here. This asserts the
	// second half of the fix: even a name that got through is an argument, so
	// no part of it is parsed as shell text.
	cmd := scriptCommand("a.sh; reboot", "/etc/kvm/scripts/a.sh; reboot")

	for _, arg := range cmd.Args {
		if strings.Contains(arg, "-c") {
			t.Fatalf("args are %q, want no shell -c", cmd.Args)
		}
	}
	if cmd.Args[len(cmd.Args)-1] != "/etc/kvm/scripts/a.sh; reboot" {
		t.Fatalf("the path must stay one argument, got %q", cmd.Args)
	}
}

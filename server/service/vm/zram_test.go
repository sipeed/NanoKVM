package vm

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// zramPaths collects the temporary files that stand in for the device's real
// ones during a test.
type zramPaths struct {
	// moduleDir stands in for /kvmapp/system/ko, which the install package
	// restores on an update. fallbackDir stands in for /mnt/system/ko, the
	// base image directory where a pair installed by hand lands today.
	moduleDir   string
	fallbackDir string

	initScript string
	initSource string
	sysfsDir   string
	swaps      string
	vmstat     string

	// commands records what the service would have run on the device.
	commands *[]string
}

// useZramPaths points the zram service at a temporary tree for one test. The
// tree starts empty, which is a board that has never had zram installed.
func useZramPaths(t *testing.T) zramPaths {
	t.Helper()

	root := t.TempDir()
	var commands []string
	paths := zramPaths{
		moduleDir:   filepath.Join(root, "kvmapp", "ko"),
		fallbackDir: filepath.Join(root, "mnt", "ko"),

		initScript: filepath.Join(root, "init.d", "S01zram"),
		initSource: filepath.Join(root, "kvmapp", "S01zram"),
		sysfsDir:   filepath.Join(root, "sys", "zram0"),
		swaps:      filepath.Join(root, "swaps"),
		vmstat:     filepath.Join(root, "vmstat"),
		commands:   &commands,
	}

	for _, dir := range []string{paths.moduleDir, paths.fallbackDir, filepath.Dir(paths.initScript)} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			t.Fatalf("failed to create %s: %s", dir, err)
		}
	}

	original := []*string{
		&zramInitScript, &zramInitSource,
		&zramSysfsDir, &procSwapsPath, &procVmstatPath,
	}
	saved := make([]string, len(original))
	for i, p := range original {
		saved[i] = *p
	}
	savedDirs := zramModuleDirs
	originalRunner := runShellCommand
	t.Cleanup(func() {
		for i, p := range original {
			*p = saved[i]
		}
		zramModuleDirs = savedDirs
		runShellCommand = originalRunner
	})

	zramModuleDirs = []string{paths.moduleDir, paths.fallbackDir}
	zramInitScript = paths.initScript
	zramInitSource = paths.initSource
	zramSysfsDir = paths.sysfsDir
	procSwapsPath = paths.swaps
	procVmstatPath = paths.vmstat
	runShellCommand = func(command string) error {
		commands = append(commands, command)
		return nil
	}

	// A device with no swap at all is the starting point.
	paths.writeFile(t, paths.swaps, "Filename\tType\tSize\tUsed\tPriority\n")
	paths.writeFile(t, paths.initSource, "#!/bin/sh\n# S01zram\n")

	return paths
}

// startSucceeds makes the fake runner behave like an init script that brings
// the device up: `start` puts zram into /proc/swaps and `stop` takes it out.
func (p zramPaths) startSucceeds(t *testing.T) {
	t.Helper()

	runShellCommand = func(command string) error {
		*p.commands = append(*p.commands, command)

		switch {
		case strings.HasSuffix(command, " start"):
			p.activate(t)
		case strings.HasSuffix(command, " stop"), strings.HasPrefix(command, "swapoff "):
			p.writeFile(t, p.swaps, "Filename\tType\tSize\tUsed\tPriority\n")
		}

		return nil
	}
}

// writeFile creates one file inside the temporary tree.
func (p zramPaths) writeFile(t *testing.T, path string, content string) {
	t.Helper()

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("failed to create %s: %s", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("failed to write %s: %s", path, err)
	}
}

// installModules writes both kernel modules, which is what makes zram
// available.
func (p zramPaths) installModules(t *testing.T) {
	t.Helper()

	p.writeFile(t, filepath.Join(p.moduleDir, "zram.ko"), "")
	p.writeFile(t, filepath.Join(p.moduleDir, "zsmalloc.ko"), "")
}

// activate writes the sysfs and /proc state of a running zram device.
func (p zramPaths) activate(t *testing.T) {
	t.Helper()

	p.writeFile(t, filepath.Join(p.sysfsDir, "disksize"), "100663296\n")
	p.writeFile(t, filepath.Join(p.sysfsDir, "comp_algorithm"), "lzo [lzo-rle] zstd\n")
	p.writeFile(t, filepath.Join(p.sysfsDir, "mm_stat"),
		"3366912  1220608  1708032 41943040  1708032      512        0        0\n")
	p.writeFile(t, p.swaps,
		"Filename\t\t\t\tType\t\tSize\tUsed\tPriority\n"+
			"/dev/zram0                              partition\t98300\t3200\t100\n")
	p.writeFile(t, p.vmstat, "pswpin 6503\npswpout 40449\n")
}

func TestReadZramStatusOnABareBoard(t *testing.T) {
	useZramPaths(t)

	status := readZramStatus()

	if status.Available {
		t.Error("available = true with no modules installed")
	}
	if status.Enabled {
		t.Error("enabled = true with no init script")
	}
	if status.Active {
		t.Error("active = true with no swap device")
	}
	if status.DiskSize != 0 || status.Original != 0 || status.MemLimit != 0 {
		t.Errorf("expected zero sizes, got %+v", status)
	}
}

func TestReadZramStatusNeedsBothModules(t *testing.T) {
	tests := []struct {
		name    string
		present []string
		want    bool
	}{
		{name: "neither module", present: nil, want: false},
		{name: "only zram.ko", present: []string{"zram.ko"}, want: false},
		{name: "only zsmalloc.ko", present: []string{"zsmalloc.ko"}, want: false},
		{name: "both modules", present: []string{"zram.ko", "zsmalloc.ko"}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths := useZramPaths(t)
			for _, module := range tt.present {
				paths.writeFile(t, filepath.Join(paths.moduleDir, module), "")
			}

			if got := readZramStatus().Available; got != tt.want {
				t.Errorf("available = %v, want %v", got, tt.want)
			}
		})
	}
}

// The modules used to be read from /mnt/system/ko alone. /mnt is a plain
// directory on the root filesystem, not a mount point, so a rootfs update
// removes a pair installed there and the board runs with no swap until
// somebody reads /bootlog. /kvmapp/system/ko is part of the install package
// and is searched first, so modules placed there survive an update.
func TestReadZramStatusFindsModulesInEitherDirectory(t *testing.T) {
	tests := []struct {
		name    string
		install func(t *testing.T, p zramPaths)
		want    bool
	}{
		{
			name: "install package only",
			install: func(t *testing.T, p zramPaths) {
				p.writeFile(t, filepath.Join(p.moduleDir, "zram.ko"), "")
				p.writeFile(t, filepath.Join(p.moduleDir, "zsmalloc.ko"), "")
			},
			want: true,
		},
		{
			name: "hand-installed pair only",
			install: func(t *testing.T, p zramPaths) {
				p.writeFile(t, filepath.Join(p.fallbackDir, "zram.ko"), "")
				p.writeFile(t, filepath.Join(p.fallbackDir, "zsmalloc.ko"), "")
			},
			want: true,
		},
		{
			// A pair split across two directories is two different builds.
			// Loading one of each is how a board gets a module that resolves
			// its symbols against the wrong copy, so neither directory counts.
			name: "one module in each directory",
			install: func(t *testing.T, p zramPaths) {
				p.writeFile(t, filepath.Join(p.moduleDir, "zram.ko"), "")
				p.writeFile(t, filepath.Join(p.fallbackDir, "zsmalloc.ko"), "")
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths := useZramPaths(t)
			tt.install(t, paths)

			if got := readZramStatus().Available; got != tt.want {
				t.Errorf("available = %v, want %v", got, tt.want)
			}
		})
	}
}

// The install package copy is the one an image build refreshes, so it is the
// one that matches the rest of the installed firmware.
func TestZramModuleDirPrefersTheInstallPackage(t *testing.T) {
	paths := useZramPaths(t)
	for _, dir := range []string{paths.moduleDir, paths.fallbackDir} {
		paths.writeFile(t, filepath.Join(dir, "zram.ko"), "")
		paths.writeFile(t, filepath.Join(dir, "zsmalloc.ko"), "")
	}

	if got := zramModuleDir(); got != paths.moduleDir {
		t.Errorf("zramModuleDir() = %q, want %q", got, paths.moduleDir)
	}
}

func TestReadZramStatusReportsRunningDevice(t *testing.T) {
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.writeFile(t, paths.initScript, "#!/bin/sh\n")
	paths.activate(t)

	status := readZramStatus()

	if !status.Available || !status.Enabled || !status.Active {
		t.Fatalf("expected all three flags true, got %+v", status)
	}
	if status.Algorithm != "lzo-rle" {
		t.Errorf("algorithm = %q, want %q", status.Algorithm, "lzo-rle")
	}
	if status.DiskSize != 100663296 {
		t.Errorf("diskSize = %d, want 100663296", status.DiskSize)
	}
	if status.Original != 3366912 || status.Compressed != 1220608 {
		t.Errorf("got original=%d compressed=%d, want 3366912 and 1220608",
			status.Original, status.Compressed)
	}
	if status.MemUsed != 1708032 || status.MemLimit != 41943040 {
		t.Errorf("got memUsed=%d memLimit=%d, want 1708032 and 41943040",
			status.MemUsed, status.MemLimit)
	}
	if status.SwapIn != 6503 || status.SwapOut != 40449 {
		t.Errorf("got swapIn=%d swapOut=%d, want 6503 and 40449",
			status.SwapIn, status.SwapOut)
	}
}

func TestReadZramStatusEnabledButNotActive(t *testing.T) {
	// The init script is installed, so the setting survives a reboot, but the
	// device did not come up. This is the state a single on/off flag would
	// hide, and the one an operator most needs to see.
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.writeFile(t, paths.initScript, "#!/bin/sh\n")

	status := readZramStatus()

	if !status.Enabled {
		t.Error("enabled = false with the init script installed")
	}
	if status.Active {
		t.Error("active = true with no device in /proc/swaps")
	}
}

func TestEnableZramRefusesWithoutModules(t *testing.T) {
	paths := useZramPaths(t)

	if err := enableZram(); err == nil {
		t.Fatal("enableZram() succeeded with no modules installed")
	}

	if fileExists(paths.initScript) {
		t.Error("the init script was installed anyway")
	}
	if len(*paths.commands) != 0 {
		t.Errorf("ran %v, want no commands", *paths.commands)
	}
}

func TestEnableZramInstallsTheScriptAndStartsIt(t *testing.T) {
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.startSucceeds(t)

	if err := enableZram(); err != nil {
		t.Fatalf("enableZram() returned %s", err)
	}

	info, err := os.Stat(paths.initScript)
	if err != nil {
		t.Fatalf("the init script was not installed: %s", err)
	}
	if mode := info.Mode().Perm(); mode != 0o755 {
		// An init script that is not executable never runs at boot, and the
		// failure appears only after a reboot.
		t.Errorf("init script mode = %o, want 755", mode)
	}

	installed, err := os.ReadFile(paths.initScript)
	if err != nil {
		t.Fatalf("cannot read the installed script: %s", err)
	}
	source, err := os.ReadFile(paths.initSource)
	if err != nil {
		t.Fatalf("cannot read the source script: %s", err)
	}
	if string(installed) != string(source) {
		t.Error("the installed script does not match the packaged one")
	}

	want := paths.initScript + " start"
	if len(*paths.commands) != 1 || (*paths.commands)[0] != want {
		t.Errorf("ran %v, want [%q]", *paths.commands, want)
	}
}

func TestEnableZramRollsBackWhenTheDeviceDoesNotCome(t *testing.T) {
	// The default runner records the command without activating anything, so
	// this is a start that reports success and leaves no swap device.
	paths := useZramPaths(t)
	paths.installModules(t)

	if err := enableZram(); err == nil {
		t.Fatal("enableZram() succeeded with no device in /proc/swaps")
	}

	if fileExists(paths.initScript) {
		// Leaving it installed would report "survives a reboot" for a feature
		// that does not run.
		t.Error("the init script survived a failed start")
	}
}

func TestEnableZramIsIdempotent(t *testing.T) {
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.startSucceeds(t)

	if err := enableZram(); err != nil {
		t.Fatalf("first enableZram() returned %s", err)
	}
	if err := enableZram(); err != nil {
		t.Fatalf("second enableZram() returned %s", err)
	}

	status := readZramStatus()
	if !status.Enabled || !status.Active {
		t.Errorf("expected enabled and active, got %+v", status)
	}
}

func TestDisableZramStopsAndRemovesTheScript(t *testing.T) {
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.startSucceeds(t)
	if err := enableZram(); err != nil {
		t.Fatalf("enableZram() returned %s", err)
	}
	*paths.commands = nil

	if err := disableZram(); err != nil {
		t.Fatalf("disableZram() returned %s", err)
	}

	if fileExists(paths.initScript) {
		t.Error("the init script is still installed")
	}
	want := paths.initScript + " stop"
	if len(*paths.commands) != 1 || (*paths.commands)[0] != want {
		t.Errorf("ran %v, want [%q]", *paths.commands, want)
	}
	if readZramStatus().Active {
		t.Error("the device is still active")
	}
}

func TestDisableZramSucceedsWhenNothingIsInstalled(t *testing.T) {
	paths := useZramPaths(t)

	if err := disableZram(); err != nil {
		t.Fatalf("disableZram() returned %s", err)
	}

	if len(*paths.commands) != 0 {
		t.Errorf("ran %v, want no commands", *paths.commands)
	}
}

func TestDisableZramStopsAHandStartedDevice(t *testing.T) {
	// Someone ran the script by hand and never installed it. There is nothing
	// to remove, but the device must still stop.
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.startSucceeds(t)
	paths.activate(t)

	if err := disableZram(); err != nil {
		t.Fatalf("disableZram() returned %s", err)
	}

	want := "swapoff " + zramDevice
	if len(*paths.commands) != 1 || (*paths.commands)[0] != want {
		t.Errorf("ran %v, want [%q]", *paths.commands, want)
	}
	if readZramStatus().Active {
		t.Error("the device is still active")
	}
}

func TestReadZramStatusActiveButNotEnabled(t *testing.T) {
	// Someone ran the init script by hand without installing it. zram runs
	// now and will be gone after a reboot.
	paths := useZramPaths(t)
	paths.installModules(t)
	paths.activate(t)

	status := readZramStatus()

	if status.Enabled {
		t.Error("enabled = true with no init script installed")
	}
	if !status.Active {
		t.Error("active = false with the device in /proc/swaps")
	}
}

func TestParseMmStat(t *testing.T) {
	tests := []struct {
		name       string
		content    string
		original   int64
		compressed int64
		memUsed    int64
		memLimit   int64
	}{
		{
			name:       "a live device",
			content:    "3366912  1220608  1708032 41943040  1708032      512        0        0\n",
			original:   3366912,
			compressed: 1220608,
			memUsed:    1708032,
			memLimit:   41943040,
		},
		{
			name:    "an idle device reports zeros",
			content: "0 0 0 41943040 0 0 0 0\n",
			// A device with nothing swapped out still reports its limit.
			memLimit: 41943040,
		},
		{
			name:       "no trailing newline",
			content:    "4096 1024 8192 0 8192 0 0 0",
			original:   4096,
			compressed: 1024,
			memUsed:    8192,
		},
		{
			name: "a short line yields what it has",
			// mem_limit is absent, so it stays zero rather than reading a
			// neighbouring field.
			content:    "4096 1024 8192",
			original:   4096,
			compressed: 1024,
			memUsed:    8192,
		},
		{
			name:    "a non-numeric field stops the parse",
			content: "4096 bogus 8192 16384",
			// The fields before the bad one are still trustworthy.
			original: 4096,
		},
		{
			name:    "an empty file yields zeros",
			content: "",
		},
		{
			name:    "whitespace only yields zeros",
			content: "   \n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stat := parseMmStat(tt.content)

			if stat.Original != tt.original {
				t.Errorf("original = %d, want %d", stat.Original, tt.original)
			}
			if stat.Compressed != tt.compressed {
				t.Errorf("compressed = %d, want %d", stat.Compressed, tt.compressed)
			}
			if stat.MemUsed != tt.memUsed {
				t.Errorf("memUsed = %d, want %d", stat.MemUsed, tt.memUsed)
			}
			if stat.MemLimit != tt.memLimit {
				t.Errorf("memLimit = %d, want %d", stat.MemLimit, tt.memLimit)
			}
		})
	}
}

func TestParseCompAlgorithm(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    string
	}{
		{
			name:    "the active algorithm is the bracketed one",
			content: "lzo [lzo-rle] zstd\n",
			want:    "lzo-rle",
		},
		{
			name:    "the first entry can be the active one",
			content: "[lzo] lzo-rle zstd\n",
			want:    "lzo",
		},
		{
			name:    "the last entry can be the active one",
			content: "lzo lzo-rle [zstd]",
			want:    "zstd",
		},
		{
			name: "no brackets means no algorithm is selected yet",
			// Reading comp_algorithm before disksize is set gives an
			// unbracketed list. Reporting a guess here would be a lie.
			content: "lzo lzo-rle zstd\n",
			want:    "",
		},
		{
			name:    "an empty file yields nothing",
			content: "",
			want:    "",
		},
		{
			name:    "an unterminated bracket yields nothing",
			content: "lzo [lzo-rle zstd",
			want:    "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := parseCompAlgorithm(tt.content); got != tt.want {
				t.Errorf("parseCompAlgorithm() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestParseVmstatSwap(t *testing.T) {
	const vmstat = `nr_free_pages 8231
pgpgin 1359382
pswpin 6503
pswpout 40449
pgmajfault 4213
`

	t.Run("reads both counters", func(t *testing.T) {
		in, out := parseVmstatSwap(vmstat)
		if in != 6503 {
			t.Errorf("swap in = %d, want 6503", in)
		}
		if out != 40449 {
			t.Errorf("swap out = %d, want 40449", out)
		}
	})

	t.Run("absent counters read as zero", func(t *testing.T) {
		in, out := parseVmstatSwap("nr_free_pages 8231\n")
		if in != 0 || out != 0 {
			t.Errorf("got in=%d out=%d, want 0 and 0", in, out)
		}
	})

	t.Run("a prefix match is not a match", func(t *testing.T) {
		// pswpin_something must not be read as pswpin.
		in, out := parseVmstatSwap("pswpin_bogus 99\npswpout_bogus 98\n")
		if in != 0 || out != 0 {
			t.Errorf("got in=%d out=%d, want 0 and 0", in, out)
		}
	})
}

func TestParseSwapsHasZram(t *testing.T) {
	const header = "Filename\t\t\t\tType\t\tSize\tUsed\tPriority\n"

	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{
			name:    "zram is listed",
			content: header + "/dev/zram0                              partition\t98300\t3200\t100\n",
			want:    true,
		},
		{
			name:    "only a swap file is listed",
			content: header + "/swapfile                               file\t\t262140\t0\t-2\n",
			want:    false,
		},
		{
			name:    "no swap at all",
			content: header,
			want:    false,
		},
		{
			name: "a longer device name is not zram0",
			// /dev/zram01 would match a naive substring test.
			content: header + "/dev/zram01                             partition\t98300\t0\t-2\n",
			want:    false,
		},
		{
			name:    "an empty file",
			content: "",
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := parseSwapsHasZram(tt.content); got != tt.want {
				t.Errorf("parseSwapsHasZram() = %v, want %v", got, tt.want)
			}
		})
	}
}

package virtualdisk

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func testPaths(t *testing.T) Paths {
	t.Helper()

	dir := t.TempDir()
	return Paths{
		Config:    filepath.Join(dir, "usb.disk0"),
		Marker:    filepath.Join(dir, "kvm.disk0"),
		Pending:   filepath.Join(dir, "kvm.disk0.formatting"),
		Partition: filepath.Join(dir, "mmcblk0p3"),
	}
}

func touch(t *testing.T, path string) {
	t.Helper()
	if err := os.WriteFile(path, nil, 0o600); err != nil {
		t.Fatalf("touch %s: %v", path, err)
	}
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func TestIsConfigured(t *testing.T) {
	tests := []struct {
		name  string
		setup func(t *testing.T, paths Paths)
		want  bool
	}{
		{
			name: "ready default data partition",
			setup: func(t *testing.T, paths Paths) {
				touch(t, paths.Config)
				touch(t, paths.Marker)
				touch(t, paths.Partition)
			},
			want: true,
		},
		{
			name: "explicit ready data partition",
			setup: func(t *testing.T, paths Paths) {
				writeFile(t, paths.Config, paths.Partition+"\n")
				touch(t, paths.Marker)
				touch(t, paths.Partition)
			},
			want: true,
		},
		{
			name: "explicit ready data partition with whitespace",
			setup: func(t *testing.T, paths Paths) {
				writeFile(t, paths.Config, "  "+paths.Partition+"  \n")
				touch(t, paths.Marker)
				touch(t, paths.Partition)
			},
			want: true,
		},
		{
			name: "pending data partition",
			setup: func(t *testing.T, paths Paths) {
				touch(t, paths.Config)
				touch(t, paths.Marker)
				touch(t, paths.Pending)
				touch(t, paths.Partition)
			},
		},
		{
			name: "missing ready marker",
			setup: func(t *testing.T, paths Paths) {
				touch(t, paths.Config)
				touch(t, paths.Partition)
			},
		},
		{
			name: "missing data partition",
			setup: func(t *testing.T, paths Paths) {
				touch(t, paths.Config)
				touch(t, paths.Marker)
			},
		},
		{
			name: "custom backing file",
			setup: func(t *testing.T, paths Paths) {
				writeFile(t, paths.Config, "/data/custom.img\n")
			},
			want: true,
		},
		{
			name: "custom backing file ignores pending data partition",
			setup: func(t *testing.T, paths Paths) {
				writeFile(t, paths.Config, "/data/custom.img\n")
				touch(t, paths.Marker)
				touch(t, paths.Pending)
				touch(t, paths.Partition)
			},
			want: true,
		},
		{
			name: "no disk config",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths := testPaths(t)
			if tt.setup != nil {
				tt.setup(t, paths)
			}

			if got := IsConfigured(paths); got != tt.want {
				t.Fatalf("IsConfigured() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCommands(t *testing.T) {
	mount := []string{"mount"}
	unmount := []string{"unmount"}

	if got := Commands(false, mount, unmount); !reflect.DeepEqual(got, mount) {
		t.Fatalf("Commands(false) = %#v, want mount commands", got)
	}
	if got := Commands(true, mount, unmount); !reflect.DeepEqual(got, unmount) {
		t.Fatalf("Commands(true) = %#v, want unmount commands", got)
	}
}

package storage

import "testing"

func TestImageName(t *testing.T) {
	tests := []struct {
		file string
		want string
	}{
		{"/data/ubuntu.iso", "ubuntu"},
		{"/data/win11.img", "win11"},
		{"/data/a.b.c.iso", "a.b.c"},
		{"/data/no-extension", "no-extension"},
	}

	for _, tt := range tests {
		if got := imageName(tt.file); got != tt.want {
			t.Errorf("imageName(%q) = %q, want %q", tt.file, got, tt.want)
		}
	}
}

func TestCutName(t *testing.T) {
	tests := []struct {
		name string
		size int
		want string
	}{
		{"ubuntu", 16, "ubuntu"},
		{"Install_macOS_27_Golden_Gate", 16, "Install_macOS_27"},
		{"Install_macOS_27_Golden_Gate", 126, "Install_macOS_27_Golden_Gate"},
		// 16 bytes is 5 three byte runes and 1 spare byte
		{"中文安装镜像文件系统", 16, "中文安装镜"},
		{"中文安装镜像文件系统", 126, "中文安装镜像文件系统"},
	}

	for _, tt := range tests {
		if got := cutName(tt.name, tt.size); got != tt.want {
			t.Errorf("cutName(%q, %d) = %q, want %q", tt.name, tt.size, got, tt.want)
		}
	}
}

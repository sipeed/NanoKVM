package storage

import (
	"reflect"
	"testing"
)

func TestWatchPaths(t *testing.T) {
	tests := []struct {
		name   string
		listed string
		raw    string
		want   []string
	}{
		{
			name:   "listed directory is always watched",
			listed: "/",
			raw:    "",
			want:   []string{"/"},
		},
		{
			// The handler passes the already cleaned path it is listing; the
			// browser's expanded folders are cleaned the same way.
			name:   "expanded folders are added",
			listed: "share",
			raw:    `["/share/a","/share/b"]`,
			want:   []string{"share", "share/a", "share/b"},
		},
		{
			// A comma is legal in a folder name, which is why the list is JSON.
			name:   "a comma stays inside the name",
			listed: "/",
			raw:    `["/a,b"]`,
			want:   []string{"/", "a,b"},
		},
		{
			name:   "duplicates and blanks are dropped",
			listed: "share",
			raw:    `["/share","","/share/a","/share/a"]`,
			want:   []string{"share", "share/a"},
		},
		{
			name:   "a plain comma list still parses",
			listed: "/",
			raw:    "/a,/b",
			want:   []string{"/", "a", "b"},
		},
		{
			name:   "paths that escape the medium are dropped",
			listed: "/",
			raw:    `["../etc","/share/../../etc"]`,
			want:   []string{"/"},
		},
	}

	for _, tt := range tests {
		if got := watchPaths(tt.listed, tt.raw); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("%s: watchPaths(%q, %q) = %v, want %v", tt.name, tt.listed, tt.raw, got, tt.want)
		}
	}
}

func TestWatchPathsCap(t *testing.T) {
	raw := ""
	for i := 0; i < maxWatchPaths+10; i++ {
		raw += "/dir" + string(rune('a'+i%26)) + string(rune('a'+i/26)) + ","
	}

	if got := len(watchPaths("/", raw)); got > maxWatchPaths {
		t.Errorf("watchPaths kept %d entries, want at most %d", got, maxWatchPaths)
	}
}

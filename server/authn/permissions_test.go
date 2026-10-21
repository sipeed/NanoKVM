package authn

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"
)

func TestClosureResolvesImpliedGrants(t *testing.T) {
	cases := []struct {
		grants []Permission
		want   []Permission
	}{
		{[]Permission{PermConsoleControl}, []Permission{PermConsoleView, PermConsoleControl}},
		{[]Permission{PermMediumAttach}, []Permission{PermMediumAttach, PermLibraryRead}},
		{[]Permission{PermLibraryWrite}, []Permission{PermLibraryRead, PermLibraryWrite}},
		{[]Permission{PermTerminal}, []Permission{PermTerminal}},
		{[]Permission{"future.grant", PermMcp}, []Permission{PermConsoleView, PermMcp, "future.grant"}},
	}
	for _, tc := range cases {
		if got := Closure(tc.grants); !slices.Equal(got, tc.want) {
			t.Errorf("Closure(%v) = %v, want %v", tc.grants, got, tc.want)
		}
	}
}

func TestNormalizeTranslatesLegacyMediaGrants(t *testing.T) {
	got := NormalizeStoredPermissions([]Permission{legacyPermMediaMount, legacyPermMediaManage, PermPower})
	want := []Permission{PermMediumAttach, PermLibraryRead, PermLibraryWrite, PermPower}
	if !slices.Equal(got, want) {
		t.Fatalf("NormalizeStoredPermissions = %v, want %v", got, want)
	}
}

func TestUpdateReturnsPreviousAndKeepsUnknownGrants(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pwd")
	store := NewStore(path)
	if err := store.Create("alice", "password", RoleUser, PermConsoleView); err != nil {
		t.Fatal(err)
	}

	// A newer release stored a grant this build does not know.
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var db database
	if err = json.Unmarshal(data, &db); err != nil {
		t.Fatal(err)
	}
	index := userIndex(db.Users, "alice")
	db.Users[index].Permissions = append(db.Users[index].Permissions, "future.grant")
	if data, err = json.Marshal(db); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}

	grants := []Permission{PermConsoleControl}
	previous, updated, err := store.Update("admin", "alice", UserPatch{Permissions: &grants})
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(previous.Permissions, []Permission{PermConsoleView, "future.grant"}) {
		t.Fatalf("previous permissions = %v", previous.Permissions)
	}
	if !slices.Equal(updated.Permissions, []Permission{PermConsoleControl, "future.grant"}) {
		t.Fatalf("updated permissions = %v", updated.Permissions)
	}
}

func TestOnlyFullControlGrantsWarn(t *testing.T) {
	var warned []Permission
	for _, descriptor := range Catalog() {
		if descriptor.Risk == RiskWarn {
			warned = append(warned, descriptor.Permission)
		}
	}
	want := []Permission{PermTerminal, PermUpdate, PermMcp, PermAi}
	if !slices.Equal(warned, want) {
		t.Fatalf("warned grants = %v, want %v", warned, want)
	}
}

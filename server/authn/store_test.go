package authn

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestLegacyAccountMigratesInPlace(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pwd")
	hash, err := bcrypt.GenerateFromPassword([]byte("legacy-password"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	legacy, _ := json.Marshal(legacyAccount{Username: "owner", Password: string(hash)})
	if err = os.WriteFile(path, legacy, 0o644); err != nil {
		t.Fatal(err)
	}

	store := NewStore(path)
	user, ok, err := store.Authenticate("owner", "legacy-password")
	if err != nil || !ok {
		t.Fatalf("authenticate migrated account: ok=%v err=%v", ok, err)
	}
	if user.Role != RoleAdmin || !user.SystemAccount || user.TokenVersion == 0 {
		t.Fatalf("unexpected migrated user: %+v", user)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var db database
	if err = json.Unmarshal(data, &db); err != nil {
		t.Fatalf("account file was not migrated: %v", err)
	}
	if db.Version != currentFileVersion || len(db.Users) != 1 {
		t.Fatalf("unexpected database: %+v", db)
	}
	var downgrade legacyAccount
	if err = json.Unmarshal(data, &downgrade); err != nil || downgrade.Username != "owner" || downgrade.Password == "" {
		t.Fatalf("legacy downgrade mirror is invalid: %+v, %v", downgrade, err)
	}
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("account mode = %o, want 600", info.Mode().Perm())
	}
}

func TestCorruptAccountFileFailsClosed(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pwd")
	if err := os.WriteFile(path, []byte("not json"), 0o600); err != nil {
		t.Fatal(err)
	}
	_, ok, err := NewStore(path).Authenticate("admin", "admin")
	if err == nil || ok {
		t.Fatalf("corrupt file must fail closed: ok=%v err=%v", ok, err)
	}
}

func TestUserLifecycleAndTokenRevocation(t *testing.T) {
	store := NewStore(filepath.Join(t.TempDir(), "pwd"))
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err := store.Create("alice", "correct-horse", RoleUser); err != nil {
		t.Fatal(err)
	}
	if _, ok, err := store.Authenticate("alice", "wrong-password"); err != nil || ok {
		t.Fatalf("wrong password login: ok=%v err=%v", ok, err)
	}
	alice, err := store.Get("alice")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = store.ValidateToken("alice", alice.TokenVersion); err != nil {
		t.Fatal(err)
	}
	if _, err = store.SetPassword("alice", "new-password"); err != nil {
		t.Fatal(err)
	}
	if _, err = store.ValidateToken("alice", alice.TokenVersion); err == nil {
		t.Fatal("old token stayed valid after password change")
	}
	if _, ok, err := store.Authenticate("alice", "new-password"); err != nil || !ok {
		t.Fatalf("new password login: ok=%v err=%v", ok, err)
	}

	disabled := false
	if _, err = store.Update("admin", "alice", UserPatch{Enabled: &disabled}); err != nil {
		t.Fatal(err)
	}
	if _, ok, err := store.Authenticate("alice", "new-password"); err != nil || ok {
		t.Fatalf("disabled login: ok=%v err=%v", ok, err)
	}
	enabled := true
	if _, err = store.Update("admin", "alice", UserPatch{Enabled: &enabled}); err != nil {
		t.Fatal(err)
	}
	if err = store.Delete("admin", "alice"); err != nil {
		t.Fatal(err)
	}
	if _, err = store.Get("alice"); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("deleted user lookup error = %v", err)
	}
}

func TestLastAdminAndSelfProtection(t *testing.T) {
	store := NewStore(filepath.Join(t.TempDir(), "pwd"))
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	userRole := RoleUser
	if _, err := store.Update("admin", "admin", UserPatch{Role: &userRole}); !errors.Is(err, ErrSelfModification) {
		t.Fatalf("self demotion error = %v", err)
	}
	if err := store.Delete("admin", "admin"); !errors.Is(err, ErrSelfDelete) {
		t.Fatalf("self delete error = %v", err)
	}
	if err := store.Create("second", "second-password", RoleAdmin); err != nil {
		t.Fatal(err)
	}
	disabled := false
	if _, err := store.Update("second", "admin", UserPatch{Enabled: &disabled}); !errors.Is(err, ErrSystemAccount) {
		t.Fatalf("disable device owner error = %v", err)
	}
	if _, err := store.Update("second", "admin", UserPatch{Role: &userRole}); !errors.Is(err, ErrSystemAccount) {
		t.Fatalf("demote device owner error = %v", err)
	}
	if err := store.Delete("second", "admin"); !errors.Is(err, ErrSystemAccount) {
		t.Fatalf("delete device owner error = %v", err)
	}
	if err := store.Delete("admin", "second"); err != nil {
		t.Fatal(err)
	}
}

func TestRemovedAccountFileAndRecreatedUserInvalidateOldVersions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pwd")
	store := NewStore(path)
	admin, ok, err := store.Authenticate("admin", "admin")
	if err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}
	if err = os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if _, err = store.ValidateToken("admin", admin.TokenVersion); err == nil {
		t.Fatal("old admin token survived account-file reset")
	}

	if _, ok, err = store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("login after reset: ok=%v err=%v", ok, err)
	}
	if err = store.Create("alice", "alice-password", RoleUser); err != nil {
		t.Fatal(err)
	}
	alice, err := store.Get("alice")
	if err != nil {
		t.Fatal(err)
	}
	if err = store.Delete("admin", "alice"); err != nil {
		t.Fatal(err)
	}
	if err = store.Create("alice", "alice-password", RoleUser); err != nil {
		t.Fatal(err)
	}
	if _, err = store.ValidateToken("alice", alice.TokenVersion); err == nil {
		t.Fatal("old token survived deletion and username reuse")
	}
}

func TestConcurrentCreatesDoNotLoseUsers(t *testing.T) {
	store := NewStore(filepath.Join(t.TempDir(), "pwd"))
	if _, ok, err := store.Authenticate("admin", "admin"); err != nil || !ok {
		t.Fatalf("default login: ok=%v err=%v", ok, err)
	}

	const count = 5
	var workers sync.WaitGroup
	errorsCh := make(chan error, count)
	for index := 0; index < count; index++ {
		workers.Add(1)
		go func(index int) {
			defer workers.Done()
			errorsCh <- store.Create(fmt.Sprintf("user%d", index), "valid-password", RoleUser)
		}(index)
	}
	workers.Wait()
	close(errorsCh)
	for err := range errorsCh {
		if err != nil {
			t.Fatal(err)
		}
	}
	users, err := store.List()
	if err != nil {
		t.Fatal(err)
	}
	if len(users) != count+1 {
		t.Fatalf("got %d users, want %d", len(users), count+1)
	}
}

package authn

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sync"

	"NanoKVM-Server/utils"

	"golang.org/x/crypto/bcrypt"
)

const (
	AccountFile        = "/etc/kvm/pwd"
	currentFileVersion = 1
	defaultUsername    = "admin"
	defaultPassword    = "admin"
)

type Role string

const (
	RoleAdmin Role = "admin"
	RoleUser  Role = "user"
)

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrUserExists       = errors.New("username already exists")
	ErrLastAdmin        = errors.New("at least one enabled admin is required")
	ErrSelfModification = errors.New("administrators cannot disable or demote themselves")
	ErrSelfDelete       = errors.New("administrators cannot delete themselves")
	ErrSystemAccount    = errors.New("the device owner account must remain an enabled administrator")

	usernamePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.-]{0,31}$`)
)

type User struct {
	Username           string `json:"username"`
	PasswordHash       string `json:"password"`
	Role               Role   `json:"role"`
	Enabled            bool   `json:"enabled"`
	TokenVersion       uint64 `json:"tokenVersion"`
	MustChangePassword bool   `json:"mustChangePassword,omitempty"`
	SystemAccount      bool   `json:"systemAccount,omitempty"`
}

type UserInfo struct {
	Username      string `json:"username"`
	Role          Role   `json:"role"`
	Enabled       bool   `json:"enabled"`
	SystemAccount bool   `json:"systemAccount,omitempty"`
}

type UserPatch struct {
	Role    *Role
	Enabled *bool
}

type database struct {
	Version        int    `json:"version"`
	Users          []User `json:"users"`
	LegacyUsername string `json:"username,omitempty"`
	LegacyPassword string `json:"password,omitempty"`
}

type legacyAccount struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Store struct {
	path  string
	mutex sync.RWMutex
}

var DefaultStore = NewStore(AccountFile)

func NewStore(path string) *Store {
	return &Store{path: path}
}

func IsValidRole(role Role) bool {
	return role == RoleAdmin || role == RoleUser
}

func ValidateUsername(username string) error {
	if !usernamePattern.MatchString(username) {
		return errors.New("username must be 1-32 characters and contain only letters, numbers, '.', '_' or '-'")
	}
	return nil
}

func ValidatePassword(password string) error {
	length := len([]byte(password))
	if length < 8 || length > 72 {
		return errors.New("password must be between 8 and 72 bytes")
	}
	return nil
}

func (s *Store) List() ([]UserInfo, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	db, err := s.loadLocked(false)
	if err != nil {
		return nil, err
	}

	users := make([]UserInfo, 0, len(db.Users))
	for _, user := range db.Users {
		users = append(users, UserInfo{
			Username:      user.Username,
			Role:          user.Role,
			Enabled:       user.Enabled,
			SystemAccount: user.SystemAccount,
		})
	}
	return users, nil
}

func (s *Store) Get(username string) (*User, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	db, err := s.loadLocked(false)
	if err != nil {
		return nil, err
	}
	return findUser(db.Users, username)
}

func (s *Store) Authenticate(username, password string) (*User, bool, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	db, err := s.loadLocked(true)
	if err != nil {
		return nil, false, err
	}
	user, err := findUser(db.Users, username)
	if err != nil || !user.Enabled {
		return nil, false, nil
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) == nil {
		return user, true, nil
	}

	// Older releases stored a reversibly encrypted password. Upgrade it after
	// the first successful login so the compatibility path is not permanent.
	legacyPassword, decodeErr := utils.DecodeDecrypt(user.PasswordHash)
	if decodeErr != nil || legacyPassword != password {
		return nil, false, nil
	}

	hash, hashErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if hashErr != nil {
		return nil, false, hashErr
	}
	for index := range db.Users {
		if db.Users[index].Username == username {
			db.Users[index].PasswordHash = string(hash)
			if db.Users[index].TokenVersion == 0 {
				db.Users[index].TokenVersion = 1
			}
			user = cloneUser(&db.Users[index])
			break
		}
	}
	if err = s.saveLocked(db); err != nil {
		return nil, false, err
	}
	return user, true, nil
}

func (s *Store) ValidateToken(username string, tokenVersion uint64) (*User, error) {
	user, err := s.Get(username)
	if err != nil {
		return nil, err
	}
	if !user.Enabled || user.TokenVersion != tokenVersion {
		return nil, errors.New("session revoked")
	}
	return user, nil
}

func (s *Store) Create(username, password string, role Role) error {
	if err := ValidateUsername(username); err != nil {
		return err
	}
	if err := ValidatePassword(password); err != nil {
		return err
	}
	if !IsValidRole(role) {
		return errors.New("invalid role")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	tokenVersion, err := newTokenVersion()
	if err != nil {
		return err
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()
	db, err := s.loadLocked(true)
	if err != nil {
		return err
	}
	if _, err = findUser(db.Users, username); err == nil {
		return ErrUserExists
	}
	db.Users = append(db.Users, User{
		Username:     username,
		PasswordHash: string(hash),
		Role:         role,
		Enabled:      true,
		TokenVersion: tokenVersion,
	})
	return s.saveLocked(db)
}

func (s *Store) Update(actor, username string, patch UserPatch) (*User, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	db, err := s.loadLocked(true)
	if err != nil {
		return nil, err
	}
	index := userIndex(db.Users, username)
	if index < 0 {
		return nil, ErrUserNotFound
	}
	user := db.Users[index]

	if patch.Role != nil && !IsValidRole(*patch.Role) {
		return nil, errors.New("invalid role")
	}
	if actor == username && user.Role == RoleAdmin &&
		((patch.Role != nil && *patch.Role != RoleAdmin) || (patch.Enabled != nil && !*patch.Enabled)) {
		return nil, ErrSelfModification
	}
	if user.SystemAccount &&
		((patch.Role != nil && *patch.Role != RoleAdmin) || (patch.Enabled != nil && !*patch.Enabled)) {
		return nil, ErrSystemAccount
	}

	changed := false
	if patch.Role != nil && user.Role != *patch.Role {
		user.Role = *patch.Role
		changed = true
	}
	if patch.Enabled != nil && user.Enabled != *patch.Enabled {
		user.Enabled = *patch.Enabled
		changed = true
	}
	if !changed {
		return &user, nil
	}

	db.Users[index] = user
	if enabledAdminCount(db.Users) == 0 {
		return nil, ErrLastAdmin
	}
	db.Users[index].TokenVersion++
	if err = s.saveLocked(db); err != nil {
		return nil, err
	}
	return cloneUser(&db.Users[index]), nil
}

func (s *Store) Delete(actor, username string) error {
	if actor == username {
		return ErrSelfDelete
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()
	db, err := s.loadLocked(true)
	if err != nil {
		return err
	}
	index := userIndex(db.Users, username)
	if index < 0 {
		return ErrUserNotFound
	}
	if db.Users[index].SystemAccount {
		return ErrSystemAccount
	}
	users := append([]User(nil), db.Users[:index]...)
	users = append(users, db.Users[index+1:]...)
	if enabledAdminCount(users) == 0 {
		return ErrLastAdmin
	}
	db.Users = users
	return s.saveLocked(db)
}

func (s *Store) SetPassword(username, password string) (*User, error) {
	return s.SetPasswordAndRun(username, password, nil)
}

// SetPasswordAndRun commits the web password before running the optional
// system-side update. If that update fails, the account record is rolled back
// while the store lock is still held.
func (s *Store) SetPasswordAndRun(username, password string, afterCommit func() error) (*User, error) {
	if err := ValidatePassword(password); err != nil {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()
	db, err := s.loadLocked(true)
	if err != nil {
		return nil, err
	}
	index := userIndex(db.Users, username)
	if index < 0 {
		return nil, ErrUserNotFound
	}
	previous := *db
	previous.Users = append([]User(nil), db.Users...)
	db.Users[index].PasswordHash = string(hash)
	db.Users[index].MustChangePassword = false
	db.Users[index].TokenVersion++
	if err = s.saveLocked(db); err != nil {
		return nil, err
	}
	if afterCommit != nil {
		if err = afterCommit(); err != nil {
			if rollbackErr := s.saveLocked(&previous); rollbackErr != nil {
				return nil, fmt.Errorf("system password update failed: %v; account rollback failed: %w", err, rollbackErr)
			}
			return nil, err
		}
	}
	return cloneUser(&db.Users[index]), nil
}

func (s *Store) Revoke(username string) (*User, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	db, err := s.loadLocked(true)
	if err != nil {
		return nil, err
	}
	index := userIndex(db.Users, username)
	if index < 0 {
		return nil, ErrUserNotFound
	}
	db.Users[index].TokenVersion++
	if err = s.saveLocked(db); err != nil {
		return nil, err
	}
	return cloneUser(&db.Users[index]), nil
}

func (s *Store) loadLocked(migrate bool) (*database, error) {
	data, err := os.ReadFile(s.path)
	if errors.Is(err, os.ErrNotExist) {
		db, defaultErr := defaultDatabase()
		if defaultErr != nil {
			return nil, defaultErr
		}
		if migrate {
			if saveErr := s.saveLocked(db); saveErr != nil {
				return nil, saveErr
			}
		}
		return db, nil
	}
	if err != nil {
		return nil, err
	}

	var db database
	if err = json.Unmarshal(data, &db); err == nil && db.Version != 0 {
		if err = validateDatabase(&db); err != nil {
			return nil, err
		}
		return &db, nil
	}

	var legacy legacyAccount
	if err = json.Unmarshal(data, &legacy); err != nil || legacy.Username == "" || legacy.Password == "" {
		return nil, errors.New("invalid account file")
	}
	if err = ValidateUsername(legacy.Username); err != nil {
		return nil, fmt.Errorf("invalid legacy username: %w", err)
	}
	tokenVersion, err := newTokenVersion()
	if err != nil {
		return nil, err
	}
	db = database{
		Version: currentFileVersion,
		Users: []User{{
			Username:           legacy.Username,
			PasswordHash:       legacy.Password,
			Role:               RoleAdmin,
			Enabled:            true,
			TokenVersion:       tokenVersion,
			MustChangePassword: passwordMatches(legacy.Password, defaultPassword),
			SystemAccount:      true,
		}},
	}
	if migrate {
		if err = s.saveLocked(&db); err != nil {
			return nil, err
		}
	}
	return &db, nil
}

func (s *Store) saveLocked(db *database) error {
	if err := validateDatabase(db); err != nil {
		return err
	}
	syncLegacyAccount(db)
	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')

	directory := filepath.Dir(s.path)
	if err = os.MkdirAll(directory, 0o755); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(directory, ".pwd-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer func() { _ = os.Remove(temporaryPath) }()

	if err = temporary.Chmod(0o600); err == nil {
		_, err = temporary.Write(data)
	}
	if err == nil {
		err = temporary.Sync()
	}
	closeErr := temporary.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	if err = os.Rename(temporaryPath, s.path); err != nil {
		return err
	}

	dir, err := os.Open(directory)
	if err != nil {
		return err
	}
	defer func() { _ = dir.Close() }()
	return dir.Sync()
}

func defaultDatabase() (*database, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	tokenVersion, err := newTokenVersion()
	if err != nil {
		return nil, err
	}
	return &database{
		Version: currentFileVersion,
		Users: []User{{
			Username:           defaultUsername,
			PasswordHash:       string(hash),
			Role:               RoleAdmin,
			Enabled:            true,
			TokenVersion:       tokenVersion,
			MustChangePassword: true,
			SystemAccount:      true,
		}},
	}, nil
}

func newTokenVersion() (uint64, error) {
	var data [8]byte
	for {
		if _, err := rand.Read(data[:]); err != nil {
			return 0, err
		}
		version := binary.LittleEndian.Uint64(data[:])
		if version != 0 && version != ^uint64(0) {
			return version, nil
		}
	}
}

func validateDatabase(db *database) error {
	if db.Version != currentFileVersion {
		return fmt.Errorf("unsupported account file version: %d", db.Version)
	}
	if len(db.Users) == 0 {
		return errors.New("account file contains no users")
	}
	seen := make(map[string]struct{}, len(db.Users))
	systemAccounts := 0
	for index := range db.Users {
		user := &db.Users[index]
		if err := ValidateUsername(user.Username); err != nil {
			return err
		}
		if user.PasswordHash == "" || !IsValidRole(user.Role) {
			return errors.New("account file contains an invalid user")
		}
		if _, exists := seen[user.Username]; exists {
			return errors.New("account file contains duplicate usernames")
		}
		seen[user.Username] = struct{}{}
		if user.TokenVersion == 0 {
			user.TokenVersion = 1
		}
		if user.SystemAccount {
			systemAccounts++
			if user.Role != RoleAdmin || !user.Enabled || systemAccounts > 1 {
				return ErrSystemAccount
			}
		}
	}
	if enabledAdminCount(db.Users) == 0 {
		return ErrLastAdmin
	}
	return nil
}

func findUser(users []User, username string) (*User, error) {
	index := userIndex(users, username)
	if index < 0 {
		return nil, ErrUserNotFound
	}
	return cloneUser(&users[index]), nil
}

func userIndex(users []User, username string) int {
	for index := range users {
		if users[index].Username == username {
			return index
		}
	}
	return -1
}

func enabledAdminCount(users []User) int {
	count := 0
	for _, user := range users {
		if user.Role == RoleAdmin && user.Enabled {
			count++
		}
	}
	return count
}

func cloneUser(user *User) *User {
	if user == nil {
		return nil
	}
	copy := *user
	return &copy
}

func passwordMatches(hash, password string) bool {
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil {
		return true
	}
	legacyPassword, err := utils.DecodeDecrypt(hash)
	return err == nil && legacyPassword == password
}

// Keep a legacy top-level account mirror so downgrading to a single-user
// server still authenticates the original device owner instead of failing
// open or forcing an immediate physical reset.
func syncLegacyAccount(db *database) {
	db.LegacyUsername = ""
	db.LegacyPassword = ""
	var fallback *User
	for _, user := range db.Users {
		if user.SystemAccount {
			db.LegacyUsername = user.Username
			db.LegacyPassword = user.PasswordHash
			return
		}
		if fallback == nil && user.Role == RoleAdmin && user.Enabled {
			copy := user
			fallback = &copy
		}
	}
	if fallback != nil {
		db.LegacyUsername = fallback.Username
		db.LegacyPassword = fallback.PasswordHash
	}
}

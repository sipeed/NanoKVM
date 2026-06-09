package auth

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"

	"NanoKVM-Server/utils"
)

const AccountFile = "/etc/kvm/accounts.json"
const LegacyAccountFile = "/etc/kvm/pwd"

// Role defines the permission level of a user.
type Role string

const (
	RoleAdmin    Role = "admin"    // Full access including user management
	RoleOperator Role = "operator" // KVM control: stream, keyboard, mouse, GPIO
	RoleViewer   Role = "viewer"   // View-only: stream access
)

// Account represents a single user.
type Account struct {
	Username string `json:"username"`
	Password string `json:"password"` // bcrypt hash
	Role     Role   `json:"role"`
	Enabled  bool   `json:"enabled"`
}

// legacyAccount mirrors the old single-user format for migration.
type legacyAccount struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// GetAccounts returns all accounts, migrating from legacy format if needed.
func GetAccounts() ([]Account, error) {
	if _, err := os.Stat(AccountFile); err == nil {
		return readAccountsFile()
	}
	if _, err := os.Stat(LegacyAccountFile); err == nil {
		return migrateLegacyAccount()
	}
	return []Account{defaultAdminAccount()}, nil
}

// GetAccountByUsername returns a specific account or an error if not found.
func GetAccountByUsername(username string) (*Account, error) {
	accounts, err := GetAccounts()
	if err != nil {
		return nil, err
	}
	for _, a := range accounts {
		if a.Username == username {
			acc := a
			return &acc, nil
		}
	}
	return nil, errors.New("user not found")
}

// SaveAccounts writes the full account list to disk.
func SaveAccounts(accounts []Account) error {
	data, err := json.MarshalIndent(accounts, "", "  ")
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(AccountFile), 0o755); err != nil {
		return err
	}
	return os.WriteFile(AccountFile, data, 0o600)
}

// AddAccount appends a new user. Returns error if username exists.
func AddAccount(username, plainPassword string, role Role) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}
	for _, a := range accounts {
		if a.Username == username {
			return errors.New("username already exists")
		}
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	accounts = append(accounts, Account{
		Username: username,
		Password: string(hashed),
		Role:     role,
		Enabled:  true,
	})
	return SaveAccounts(accounts)
}

// UpdateAccountPassword changes a user's password (expects bcrypt hash).
func UpdateAccountPassword(username, hashedPassword string) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}
	for i, a := range accounts {
		if a.Username == username {
			accounts[i].Password = hashedPassword
			return SaveAccounts(accounts)
		}
	}
	return errors.New("user not found")
}

// UpdateAccountRole changes a user's role.
func UpdateAccountRole(username string, role Role) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}
	for i, a := range accounts {
		if a.Username == username {
			accounts[i].Role = role
			return SaveAccounts(accounts)
		}
	}
	return errors.New("user not found")
}

// SetAccountEnabled enables or disables a user account.
func SetAccountEnabled(username string, enabled bool) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}
	for i, a := range accounts {
		if a.Username == username {
			accounts[i].Enabled = enabled
			return SaveAccounts(accounts)
		}
	}
	return errors.New("user not found")
}

// DeleteAccount removes a user. The last admin account cannot be deleted.
func DeleteAccount(username string) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}
	var target *Account
	for _, a := range accounts {
		if a.Username == username {
			acc := a
			target = &acc
			break
		}
	}
	if target == nil {
		return errors.New("user not found")
	}
	if target.Role == RoleAdmin {
		adminCount := 0
		for _, a := range accounts {
			if a.Role == RoleAdmin && a.Enabled {
				adminCount++
			}
		}
		if adminCount <= 1 {
			return errors.New("cannot delete the last admin account")
		}
	}
	filtered := make([]Account, 0, len(accounts)-1)
	for _, a := range accounts {
		if a.Username != username {
			filtered = append(filtered, a)
		}
	}
	return SaveAccounts(filtered)
}

// CompareAccount checks credentials and returns the account on success.
func CompareAccount(username, plainPassword string) (*Account, bool) {
	account, err := GetAccountByUsername(username)
	if err != nil || account == nil || !account.Enabled {
		return nil, false
	}
	decoded, err := utils.DecodeDecrypt(plainPassword)
	if err != nil || decoded == "" {
		return nil, false
	}
	if err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(decoded)); err != nil {
		// Compatibility with old plain-hashed storage
		oldHash, _ := utils.DecodeDecrypt(account.Password)
		if oldHash != decoded {
			return nil, false
		}
	}
	return account, true
}

// IsValidRole checks whether a role string is valid.
func IsValidRole(r Role) bool {
	return r == RoleAdmin || r == RoleOperator || r == RoleViewer
}

func readAccountsFile() ([]Account, error) {
	data, err := os.ReadFile(AccountFile)
	if err != nil {
		return nil, err
	}
	var accounts []Account
	if err = json.Unmarshal(data, &accounts); err != nil {
		log.Errorf("failed to unmarshal accounts: %s", err)
		return nil, err
	}
	return accounts, nil
}

func migrateLegacyAccount() ([]Account, error) {
	data, err := os.ReadFile(LegacyAccountFile)
	if err != nil {
		return nil, err
	}
	var legacy legacyAccount
	if err = json.Unmarshal(data, &legacy); err != nil {
		log.Errorf("failed to unmarshal legacy account: %s", err)
		return []Account{defaultAdminAccount()}, nil
	}
	account := Account{
		Username: legacy.Username,
		Password: legacy.Password,
		Role:     RoleAdmin,
		Enabled:  true,
	}
	accounts := []Account{account}
	if saveErr := SaveAccounts(accounts); saveErr == nil {
		_ = os.Remove(LegacyAccountFile)
		log.Infof("migrated legacy account '%s' to multi-user format", legacy.Username)
	}
	return accounts, nil
}

func defaultAdminAccount() Account {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	return Account{
		Username: "admin",
		Password: string(hashed),
		Role:     RoleAdmin,
		Enabled:  true,
	}
}

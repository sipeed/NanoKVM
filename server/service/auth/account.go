package auth

import (
	"NanoKVM-Server/utils"
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

// AccountFile is a variable rather than a constant so tests can redirect it.
var AccountFile = "/etc/kvm/pwd"

type Account struct {
	Username string `json:"username"`
	Password string `json:"password"`	// should be named HashedPassword for clarity
}

func GetAccount() (*Account, error) {
	if _, err := os.Stat(AccountFile); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return getDefaultAccount(), nil
		}
		return nil, err
	}

	content, err := os.ReadFile(AccountFile)
	if err != nil {
		return nil, err
	}

	var account Account
	if err = json.Unmarshal(content, &account); err != nil {
		log.Errorf("unmarshal account failed: %s", err)
		return nil, err
	}

	return &account, nil
}

// isAccountConfigured reports whether a password has ever been set on this
// device. Without the file, GetAccount falls back to the admin/admin default.
//
// Only a missing file counts as unconfigured. Any other stat error means the
// answer is unknown, and the caller uses this to decide whether to demand the
// current password, so an unknown answer has to keep the check in force.
func isAccountConfigured() bool {
	if _, err := os.Stat(AccountFile); err != nil {
		return !errors.Is(err, fs.ErrNotExist)
	}

	return true
}

func SetAccount(username string, hashedPassword string) error {
	account, err := json.Marshal(&Account{
		Username: username,
		Password: hashedPassword,
	})
	if err != nil {
		log.Errorf("failed to marshal account information to json: %s", err)
		return err
	}

	err = os.MkdirAll(filepath.Dir(AccountFile), 0o644)
	if err != nil {
		log.Errorf("create directory %s failed: %s", AccountFile, err)
		return err
	}

	err = os.WriteFile(AccountFile, account, 0o644)
	if err != nil {
		log.Errorf("write password failed: %s", err)
		return err
	}

	return nil
}

func CompareAccount(username string, plainPassword string) bool {
	account, err := GetAccount()
	if err != nil {
		return false
	}

	if username != account.Username {
		return false
	}

	hashedPassword, err := utils.DecodeDecrypt(plainPassword)
	if err != nil || hashedPassword == "" {
		return false
	}

	err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(hashedPassword))
	if err != nil {
		// Compatible with old versions
		accountHashedPassword, _ := utils.DecodeDecrypt(account.Password)
		if accountHashedPassword == hashedPassword {
			return true
		}

		return false
	}

	return true
}

func DelAccount() error {
	if err := os.Remove(AccountFile); err != nil {
		log.Errorf("failed to delete password: %s", err)
		return err
	}

	return nil
}

func getDefaultAccount() *Account {
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)

	return &Account{
		Username: "admin",
		Password: string(hashedPassword),
	}
}

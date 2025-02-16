package auth

import (
	"NanoKVM-Server/utils"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

const AccountFile = "/etc/kvm/pwd"

type Account struct {
	Username string `json:"username"`
	Password string `json:"password"`
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

func SetAccount(username string, password string) error {
	account, err := json.Marshal(&Account{
		Username: username,
		Password: password,
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

func CompareAccount(username string, password string) bool {
	account, err := GetAccount()
	if err != nil {
		return false
	}

	if strings.ToLower(username) != strings.ToLower(account.Username) {
		return false
	}

	decryptedPassword, err := utils.DecodeDecrypt(password)
	if err != nil || decryptedPassword == "" {
		return false
	}

	err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(decryptedPassword))
	if err != nil {
		// Compatible with old versions
		accountDecryptedPassword, _ := utils.DecodeDecrypt(account.Password)
		if accountDecryptedPassword == decryptedPassword {
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
	password, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)

	return &Account{
		Username: "admin",
		Password: string(password),
	}
}

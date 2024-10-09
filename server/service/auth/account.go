package auth

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/utils"
)

const AccountFile = "/etc/kvm/pwd"

type Account struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func getAccount() (*Account, error) {
	// use default account
	if _, err := os.Stat(AccountFile); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return &Account{
				Username: "admin",
				Password: "admin",
			}, nil
		}

		return nil, err
	}

	content, err := os.ReadFile(AccountFile)
	if err != nil {
		return nil, err
	}

	var account Account
	err = json.Unmarshal(content, &account)
	if err != nil {
		log.Errorf("unmarshal account failed: %s", err)
		return nil, err
	}

	password, err := utils.DecodeDecrypt(account.Password)
	if err != nil {
		return nil, err
	}

	account.Password = password

	return &account, nil
}

func setAccount(username string, password string) error {
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

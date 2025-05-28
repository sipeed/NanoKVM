package auth

import (
	"NanoKVM-Server/config"
	"NanoKVM-Server/utils"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

const AccountFile = "/etc/kvm/pwd"

type OldAccount struct {
	Username string `json:"username"`
	Password string `json:"password"` // should be named HashedPassword for clarity
}

type Account struct {
	Username string `json:"username"`
	Password string `json:"password"` // should be named HashedPassword for clarity
	Group    string `json:"group"`
}

type Accounts []*Account

func GetAccount() (*Account, error) {
	return nil, nil
}

func GetAccounts() (Accounts, error) {
	if _, err := os.Stat(AccountFile); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			createDefaultAccounts()
		} else {
			return nil, err
		}
	}

	content, err := os.ReadFile(AccountFile)
	if err != nil {
		return nil, err
	}

	var accounts Accounts = []*Account{}
	if err = json.Unmarshal(content, &accounts); err != nil {
		log.Errorf("unmarshal account failed: %s", err)
		return nil, err
	}

	return accounts, nil
}

func SetAccount(username string, hashedPassword string) error {
	if username == "admin" {
		// check that is really admin
	}

	return SetAccounts(username, hashedPassword)
}

func SetAccounts(username string, hashedPassword string) error {
	accounts, err := GetAccounts()
	if err != nil {
		return err
	}

	isExists := false
	for _, account := range accounts {
		if username == account.Username {
			account.Password = hashedPassword
			isExists = true
			break
		}
	}

	if !isExists {
		accounts = append(accounts, &Account{
			Username: username,
			Password: hashedPassword,
			Group: func() string {
				if username == "admin" {
					return "admin"
				}
				return "web"
			}(),
		})
	}

	account, err := json.Marshal(accounts)
	if err != nil {
		log.Errorf("failed to marshal accounts information to json: %s", err)
		return err
	}

	err = os.MkdirAll(filepath.Dir(AccountFile), 0o644)
	if err != nil {
		log.Errorf("create directory %s failed: %s", AccountFile, err)
		return err
	}

	err = os.WriteFile(AccountFile, account, 0o644)
	if err != nil {
		log.Errorf("write passwords failed: %s", err)
		return err
	}

	return nil
}

func CompareAccount(username string, plainPassword string) *Account {
	accounts, err := GetAccounts()
	if err != nil {
		return nil
	}

	for _, account := range accounts {
		if account.Username != username {
			continue
		}

		hashedPassword, err := utils.DecodeDecrypt(plainPassword)
		if err != nil || hashedPassword == "" {
			return nil
		}

		err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(hashedPassword))
		if err != nil {
			// Compatible with old versions
			accountHashedPassword, _ := utils.DecodeDecrypt(account.Password)

			if accountHashedPassword == hashedPassword {
				return account
			}

			return nil
		}

		return account
	}

	return nil
}

func DelAccount() error {
	log.Errorf("DelAccount")
	/*if err := os.Remove(AccountFile); err != nil {
		log.Errorf("failed to delete password: %s", err)
		return err
	}*/

	return nil
}

func CheckAccountsFile() error {
	if _, err := os.Stat(AccountFile); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return createDefaultAccounts()
		} else {
			return err
		}
	}

	content, err := os.ReadFile(AccountFile)
	if err != nil {
		return err
	}

	var oldAccount OldAccount
	if err := json.Unmarshal(content, &oldAccount); err != nil { // sic!
		return nil
	}

	log.Errorf("remove old account file format: %s", err)
	os.Remove(AccountFile)

	createDefaultAccounts()

	return nil
}

func createDefaultAccounts() error {
	var accounts Accounts = []*Account{}

	log.Infof("create default accounts file")

	// admin
	hashedAdminPassword, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	accounts = append(accounts, &Account{
		Username: "admin",
		Password: string(hashedAdminPassword),
		Group:    "admin",
	})

	//web
	hashedWebPassword, _ := bcrypt.GenerateFromPassword([]byte("web"), bcrypt.DefaultCost)
	accounts = append(accounts, &Account{
		Username: "web",
		Password: string(hashedWebPassword),
		Group:    "web",
	})

	account, err := json.Marshal(accounts)
	if err != nil {
		log.Errorf("failed to marshal accounts information to json: %s", err)
		return err
	}

	err = os.MkdirAll(filepath.Dir(AccountFile), 0o644)
	if err != nil {
		log.Errorf("create directory %s failed: %s", AccountFile, err)
		return err
	}

	err = os.WriteFile(AccountFile, account, 0o644)
	if err != nil {
		log.Errorf("write passwords failed: %s", err)
		return err
	}

	return nil
}

func GetUserByToken(token string) *config.User {
	user, ok := config.GetInstance().Tokens[token]
	if ok {
		return user
	}

	return nil
}

func GetUserByCookie(c *gin.Context) *config.User {
	cookie, err := c.Cookie("nano-kvm-token")
	if err == nil {
		return GetUserByToken(cookie)
	}

	return nil
}

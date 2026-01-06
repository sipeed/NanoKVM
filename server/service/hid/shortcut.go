package hid

import (
	"encoding/json"
	"errors"
	"os"
	"sync"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

var (
	shortcutFile  = "/etc/kvm/shortcuts.json"
	shortcutMutex = sync.RWMutex{}
)

type ShortcutStore struct {
	Shortcuts []proto.Shortcut `json:"shortcuts"`
}

func (s *Service) GetShortcuts(c *gin.Context) {
	var rsp proto.Response

	shortcuts, err := listShortcuts()
	if err != nil {
		log.Errorf("failed to get shortcuts: %v", err)
		rsp.ErrRsp(c, -1, "get shortcuts failed")
		return
	}

	rsp.OkRspWithData(c, &proto.GetShortcutsRsp{
		Shortcuts: shortcuts,
	})
	log.Debugf("get shortcuts success, total: %d", len(shortcuts))
}

func (s *Service) AddShortcut(c *gin.Context) {
	var req proto.AddShortcutReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	shortcut, err := addShortcut(req.Keys)
	if err != nil {
		log.Errorf("failed to add shortcut: %v", err)
		rsp.ErrRsp(c, -2, "add shortcut failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("add shortcut %s", shortcut.ID)
}

func (s *Service) DeleteShortcut(c *gin.Context) {
	var req proto.DeleteShortcutReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	err := deleteShortcut(req.ID)
	if err != nil {
		log.Errorf("failed to delete shortcut: %v", err)
		rsp.ErrRsp(c, -2, "delete shortcut failed")
		return
	}

	rsp.OkRsp(c)
	log.Debugf("delete shortcut %s", req.ID)
}

func loadShortcuts() (*ShortcutStore, error) {
	if _, err := os.Stat(shortcutFile); os.IsNotExist(err) {
		return &ShortcutStore{Shortcuts: []proto.Shortcut{}}, nil
	}

	data, err := os.ReadFile(shortcutFile)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return &ShortcutStore{Shortcuts: []proto.Shortcut{}}, nil
	}

	var store ShortcutStore
	if err := json.Unmarshal(data, &store); err != nil {
		return nil, err
	}

	return &store, nil
}

func saveShortcuts(store *ShortcutStore) error {
	data, err := json.Marshal(store)
	if err != nil {
		return err
	}

	return os.WriteFile(shortcutFile, data, 0644)
}

func listShortcuts() ([]proto.Shortcut, error) {
	shortcutMutex.RLock()
	defer shortcutMutex.RUnlock()

	store, err := loadShortcuts()
	if err != nil {
		return nil, err
	}

	return store.Shortcuts, nil
}

func addShortcut(keys []proto.ShortcutKey) (*proto.Shortcut, error) {
	shortcutMutex.Lock()
	defer shortcutMutex.Unlock()

	store, err := loadShortcuts()
	if err != nil {
		return nil, err
	}

	shortcut := proto.Shortcut{
		ID:   uuid.New().String(),
		Keys: keys,
	}

	store.Shortcuts = append(store.Shortcuts, shortcut)

	if err := saveShortcuts(store); err != nil {
		return nil, err
	}

	return &shortcut, nil
}

func deleteShortcut(id string) error {
	shortcutMutex.Lock()
	defer shortcutMutex.Unlock()

	store, err := loadShortcuts()
	if err != nil {
		return err
	}

	found := false
	newShortcuts := make([]proto.Shortcut, 0, len(store.Shortcuts))
	for _, shortcut := range store.Shortcuts {
		if shortcut.ID == id {
			found = true
			continue
		}
		newShortcuts = append(newShortcuts, shortcut)
	}

	if !found {
		return errors.New("shortcut not found")
	}

	store.Shortcuts = newShortcuts
	return saveShortcuts(store)
}

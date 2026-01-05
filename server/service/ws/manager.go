package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

var (
	globalManager *Manager
	managerOnce   sync.Once
)

func GetManager() *Manager {
	managerOnce.Do(func() {
		globalManager = &Manager{
			clients: make(map[*websocket.Conn]*Client),
			mutex:   sync.RWMutex{},
		}
	})
	return globalManager
}

func (m *Manager) AddClient(ws *websocket.Conn, client *Client) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.clients[ws] = client
}

func (m *Manager) RemoveClient(ws *websocket.Conn) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	delete(m.clients, ws)
}

func (m *Manager) GetClients() []*Client {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	clients := make([]*Client, 0, len(m.clients))
	for _, c := range m.clients {
		clients = append(clients, c)
	}

	return clients
}

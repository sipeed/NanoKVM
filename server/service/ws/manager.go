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

// NotifyUser sends an event to every connection owned by the user, e.g. to
// tell the frontend that account permissions changed.
func (m *Manager) NotifyUser(username string, event string, data string) {
	for _, client := range m.GetClients() {
		if client.username == username {
			_ = client.Write(event, data)
		}
	}
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

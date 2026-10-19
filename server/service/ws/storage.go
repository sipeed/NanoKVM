package ws

import (
	"NanoKVM-Server/service/storage"

	log "github.com/sirupsen/logrus"
)

// StorageEvent tells the web UI that the shared files view was refreshed: the
// watcher drops the exFAT metadata caches and reports what the target machine
// wrote to the data partition, including the size a transfer has reached. The
// listener simply re-reads what it is showing.
const StorageEvent = "storage"

// storageNotifications carries the refresh notifications to their own
// goroutine. The watcher refreshes once a second while the target machine owns
// the shared files, and a client that stopped reading would otherwise hold it
// up for a whole write deadline on every refresh. One slot is enough: a
// notification that arrives while one is still going out is not worth a second
// write, because the listener reads the current state either way.
var storageNotifications = make(chan struct{}, 1)

func init() {
	storage.SubscribePartitionChanges(queueStorageChanged)
	go broadcastStorageChanges()
}

func queueStorageChanged() {
	select {
	case storageNotifications <- struct{}{}:
	default:
	}
}

func broadcastStorageChanges() {
	for range storageNotifications {
		broadcastStorageChanged()
	}
}

func broadcastStorageChanged() {
	for _, client := range GetManager().GetClients() {
		if err := client.Write(StorageEvent, "{}"); err != nil {
			log.Errorf("failed to send storage change: %s", err)
		}
	}
}

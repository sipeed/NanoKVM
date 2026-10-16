package storage

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"

	"NanoKVM-Server/service/storage/diskfs"
)

// The shared files medium is the data partition block device handed to the
// target machine while this device keeps it mounted: two writers on one
// filesystem. The target machine's writes arrive through the emulated USB disk
// and land in this device's page cache for that block device - the very cache
// the mounted exFAT reads its directory data from, so the file data on this
// side already is what the target machine wrote. What does not follow is the
// metadata this side cached: a file the target grew keeps the size it had when
// it was first read, and a directory that grew keeps the cluster chain it was
// first walked with. Dropping the dentry and inode caches makes a listing see
// the target machine's version. The page cache is deliberately left alone: it
// holds that version already, and dropping it would only add card reads.
//
// Nothing tells this side that those block level writes happened. They bypass
// the VFS, so inotify and fanotify stay silent, and the partition's write
// counter in /proc/diskstats only moves once this side writes its own dirty
// pages back - which can be tens of seconds after the target wrote, or when
// the target itself asks the disk to flush. The watcher therefore refreshes on
// a timer while the target machine owns the partition; the interval only
// bounds how long the web UI can lag behind the target's own writeback.
const (
	// partitionWatchInterval is how often the shared files view is refreshed
	// while the target machine owns the partition. Reading one directory is
	// cheap, so the interval is chosen to keep a listing from looking stuck,
	// not to save work.
	partitionWatchInterval = time.Second
	// partitionWriteQuiet is how long a change keeps counting as a transfer in
	// progress. The target machine flushes in bursts, and its own writeback can
	// hold the final size update for tens of seconds (Linux flushes dirty
	// metadata only after dirty_expire_centisecs), so a short quiet spell is
	// not the end of a copy.
	partitionWriteQuiet = 45 * time.Second
)

var (
	partitionCacheMu     sync.Mutex
	partitionLastChange  time.Time
	partitionBrowsedPath string
	partitionListeners   []func()
	partitionWatchOnce   sync.Once
)

// startPartitionWatcher starts the periodic refresh of the shared files view.
func startPartitionWatcher() {
	partitionWatchOnce.Do(func() {
		go watchPartitionChanges()
	})
}

func watchPartitionChanges() {
	var lastSignature string

	for {
		time.Sleep(partitionWatchInterval)

		// Only the target machine's writes bypass this side's caches; while
		// this device is the only writer, the filesystem's own caches are
		// current and dropping them would be wasted work.
		if !IsAttached(partitionDevice) {
			continue
		}

		invalidatePartitionCache()

		// The signature is taken after the drop, so it compares what a listing
		// would show now. It is what tells a transfer in progress - the sizes
		// grow - from an idle medium, and it is also what keeps an idle shared
		// folder from making the web UI re-read it every second.
		signature := partitionSignature()
		if signature == lastSignature {
			continue
		}
		lastSignature = signature

		partitionCacheMu.Lock()
		partitionLastChange = time.Now()
		partitionCacheMu.Unlock()

		notifyPartitionListeners()
	}
}

// SetPartitionBrowsePath tells the watcher which directory of the shared
// folder the web UI is showing. A change inside a subdirectory does not move
// the folder's own signature, so the directory being browsed is watched too.
// An empty path stops watching a directory.
func SetPartitionBrowsePath(browsePath string) {
	partitionCacheMu.Lock()
	partitionBrowsedPath = browsePath
	partitionCacheMu.Unlock()
}

// SubscribePartitionChanges registers fn for "the shared files view was
// refreshed" notifications: once per refresh while the target machine owns the
// partition. fn runs on the watcher goroutine.
func SubscribePartitionChanges(fn func()) {
	partitionCacheMu.Lock()
	defer partitionCacheMu.Unlock()

	partitionListeners = append(partitionListeners, fn)
}

func notifyPartitionListeners() {
	partitionCacheMu.Lock()
	listeners := append([]func(){}, partitionListeners...)
	partitionCacheMu.Unlock()

	for _, fn := range listeners {
		fn()
	}
}

// partitionWriting reports whether the shared files changed within the quiet
// window. A zero length file listed in that state is a transfer in progress,
// not an empty file.
func partitionWriting() bool {
	// Only the target machine's writes arrive without this side knowing, so a
	// hint left over from the last time it owned the partition would mislead a
	// file browser that is reading the medium itself now.
	if !IsAttached(partitionDevice) {
		return false
	}

	partitionCacheMu.Lock()
	defer partitionCacheMu.Unlock()

	return !partitionLastChange.IsZero() && time.Since(partitionLastChange) < partitionWriteQuiet
}

// invalidatePartitionCache drops the stale metadata caches. It is the entry
// point both for the watcher and for a listing, so a request never has to wait
// for the next tick.
func invalidatePartitionCache() {
	if !IsAttached(partitionDevice) {
		return
	}

	dropPartitionCaches()
}

// partitionSignature summarizes what a listing would show: the shared folder
// itself, which is where files are exchanged, and the directory the file
// browser has open. Names, sizes and timestamps are all compared, because a
// copy changes the size of an entry it already added.
func partitionSignature() string {
	partitionCacheMu.Lock()
	browsed := partitionBrowsedPath
	partitionCacheMu.Unlock()

	signature := directorySignature(mediaDirectory)
	if browsed == "" || browsed == "/" {
		return signature
	}

	dir, err := diskfs.ResolveInside(mediaDirectory, browsed)
	if err != nil {
		return signature
	}

	return signature + directorySignature(dir)
}

func directorySignature(dir string) string {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return ""
	}

	var signature strings.Builder
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue // vanished between the directory read and the stat
		}
		fmt.Fprintf(&signature, "%s|%d|%d|%t\n", entry.Name(), info.Size(), info.ModTime().Unix(), entry.IsDir())
	}

	return signature.String()
}

// dropPartitionCaches drops the dentries and inodes, which is what makes a
// listing see the target machine's entries and sizes. Dirty pages survive a
// drop, so gadget writes still in flight are not lost. The value is 2 plus 4:
// the extra bit is what keeps the kernel from logging a line every second,
// which is how a mount lasting a day used to fill the log on the data
// partition.
func dropPartitionCaches() {
	if err := os.WriteFile("/proc/sys/vm/drop_caches", []byte("6"), 0); err != nil {
		log.Warnf("drop stale caches failed: %s", err)
	}
}

// dropAllPartitionCaches throws away everything this side cached of the data
// partition, page cache included: it runs when the partition stops being
// served to the target machine, where a stale page written back would land on
// top of what the target machine just wrote. 7 is 3 (page cache, dentries and
// inodes) plus 4, so the drop is not logged either.
func dropAllPartitionCaches() {
	if err := os.WriteFile("/proc/sys/vm/drop_caches", []byte("7"), 0); err != nil {
		log.Warnf("drop stale caches failed: %s", err)
	}
}

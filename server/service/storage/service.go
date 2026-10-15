package storage

import "sync"

// Service backs the virtual media API. The job fields belong to the single
// long running media operation (a file being written into a medium); they
// follow the download service's shape, so the web UI polls both with the same
// vocabulary.
type Service struct {
	jobMutex   sync.Mutex
	jobDone    chan struct{}
	jobWaiters []chan struct{}
	jobState   jobState
	jobName    string
	jobLoaded  int64
	jobTotal   int64
	jobMessage string
}

func NewService() *Service {
	startPartitionWatcher()
	return &Service{jobState: jobStateIdle}
}

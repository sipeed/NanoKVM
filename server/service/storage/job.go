package storage

import (
	"context"
	"errors"
	"sync/atomic"
	"time"

	"NanoKVM-Server/utils"
)

type jobState string

const (
	jobStateIdle       jobState = "idle"
	jobStateInProgress jobState = "in_progress"
	jobStateSuccess    jobState = "success"
	jobStateFailed     jobState = "failed"
)

// jobProgressInterval matches the ticker the downloader reports with, so the
// web UI polls every transfer the same way.
const jobProgressInterval = 2500 * time.Millisecond

// maxQueuedJobs bounds the queue: the transfers hold their HTTP connections
// open while they wait, so an unbounded queue would let one client hoard them.
const maxQueuedJobs = 8

var errTooManyJobs = errors.New("too many transfers are already queued")

// activeJobs counts the file manager transfers holding a job slot, across
// every Service, so code outside the handlers can tell whether a transfer
// temporary may still be written.
var activeJobs atomic.Int32

// TransferInProgress reports whether any transfer that writes a temporary
// file can be running: a file manager upload holds a job slot, the image
// downloader and the updater hold the transfer lock file. A temporary found
// while this is false was left behind by an interrupted transfer.
func TransferInProgress() bool {
	return activeJobs.Load() > 0 || pathExists(utils.TransferSentinelPath)
}

// activeJobTarget returns the path the running upload writes, if any.
func (s *Service) activeJobTarget() (string, bool) {
	s.jobMutex.Lock()
	defer s.jobMutex.Unlock()

	return s.jobName, s.jobDone != nil
}

// beginJob claims the single media job slot, queueing behind whatever is
// running instead of refusing: the user asked for a file to be written, and
// waiting their turn is what they expect. The queue is first come, first
// served, and a request whose client goes away leaves it.
//
// The transfer lock file that coordinates with the image downloader and the
// application updater is deliberately not taken here. Writing into an image
// only touches blocks that image already owns, so it neither races the
// downloader nor holds it up.
func (s *Service) beginJob(ctx context.Context, name string) (chan struct{}, error) {
	for {
		s.jobMutex.Lock()

		if s.jobDone == nil {
			done := make(chan struct{})
			s.jobDone = done
			s.jobState = jobStateInProgress
			s.jobName = name
			s.jobLoaded = 0
			s.jobTotal = 0
			s.jobMessage = ""
			activeJobs.Add(1)
			s.jobMutex.Unlock()

			return done, nil
		}

		if len(s.jobWaiters) >= maxQueuedJobs {
			s.jobMutex.Unlock()
			return nil, errTooManyJobs
		}

		waiter := make(chan struct{})
		s.jobWaiters = append(s.jobWaiters, waiter)
		s.jobMutex.Unlock()

		select {
		case <-waiter:
			// Our turn; the loop tries to claim the slot.
		case <-ctx.Done():
			s.abandonWaiter(waiter)
			return nil, ctx.Err()
		}
	}
}

// abandonWaiter drops a waiter whose client went away. A waiter that is still
// queued only has to leave the queue; one that was already handed the turn
// (finishJob closed its channel) has to pass it on, or the transfers waiting
// behind it would sit there until their own clients gave up too.
func (s *Service) abandonWaiter(waiter chan struct{}) {
	s.jobMutex.Lock()
	defer s.jobMutex.Unlock()

	for i, queued := range s.jobWaiters {
		if queued == waiter {
			s.jobWaiters = append(s.jobWaiters[:i], s.jobWaiters[i+1:]...)
			return
		}
	}

	if s.jobDone == nil && len(s.jobWaiters) > 0 {
		close(s.jobWaiters[0])
		s.jobWaiters = s.jobWaiters[1:]
	}
}

func (s *Service) setJobProgress(done chan struct{}, loaded, total int64) {
	s.jobMutex.Lock()
	defer s.jobMutex.Unlock()

	if s.jobDone == done {
		s.jobLoaded = loaded
		s.jobTotal = total
	}
}

func (s *Service) finishJob(done chan struct{}, state jobState, message string) {
	s.jobMutex.Lock()
	if s.jobDone != done {
		s.jobMutex.Unlock()
		return
	}

	s.jobDone = nil
	activeJobs.Add(-1)
	s.jobState = state
	s.jobLoaded = 0
	s.jobTotal = 0
	s.jobMessage = message

	// The slot goes to whoever queued first.
	if len(s.jobWaiters) > 0 {
		close(s.jobWaiters[0])
		s.jobWaiters = s.jobWaiters[1:]
	}
	s.jobMutex.Unlock()

	close(done)
}

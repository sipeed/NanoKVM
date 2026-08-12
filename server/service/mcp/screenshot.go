package mcpservice

import "context"

const snapshotTimeoutMaxMS = 30_000

type SnapshotRequest struct {
	Quality   int
	TimeoutMS *int
	X         int
	Y         int
	W         int
	H         int
}

type Snapshot struct {
	OK      bool
	RetCode int
	Message string
	Width   int
	Height  int
	JPEG    []byte
}

type Snapshotter interface {
	Capture(context.Context, SnapshotRequest) (Snapshot, error)
}

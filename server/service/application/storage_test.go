package application

import (
	"math"
	"testing"
)

func TestReserveBytesAndSpaceBoundary(t *testing.T) {
	if got := reserveBytes(1 << 30); got != minFreeReserve {
		t.Fatalf("reserve for 1 GiB = %d, want %d", got, minFreeReserve)
	}
	if got := reserveBytes(4 << 30); got != 214748364 {
		t.Fatalf("reserve for 4 GiB = %d, want 214748364", got)
	}
	space := filesystemSpace{total: 1 << 30, available: (1 << 20) + minFreeReserve}
	ok, required, err := hasFreeSpace(space, 1<<20)
	if err != nil || !ok || required != space.available {
		t.Fatalf("boundary should fit: ok=%v required=%d err=%v", ok, required, err)
	}
	space.available--
	ok, _, err = hasFreeSpace(space, 1<<20)
	if err != nil || ok {
		t.Fatalf("one byte short should fail: ok=%v err=%v", ok, err)
	}
}

func TestStorageOverflowIsRejected(t *testing.T) {
	if _, err := filesystemSpaceFromStats(math.MaxUint64, 1, 2); err == nil {
		t.Fatal("expected filesystem overflow")
	}
	if _, _, err := hasFreeSpace(filesystemSpace{total: 1}, math.MaxUint64); err == nil {
		t.Fatal("expected requirement overflow")
	}
}

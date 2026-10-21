package auth

import (
	"errors"
	"testing"

	"NanoKVM-Server/authn"
)

func TestRotateAPIKeyOnlyWhenLostAndRequested(t *testing.T) {
	calls := 0
	failing := false
	original := APIKeyRotator
	APIKeyRotator = func() error {
		calls++
		if failing {
			return errors.New("disk full")
		}
		return nil
	}
	defer func() { APIKeyRotator = original }()

	withMcp := []authn.Permission{authn.PermConsoleView, authn.PermMcp}
	without := []authn.Permission{authn.PermConsoleView}

	cases := []struct {
		name              string
		previous, current []authn.Permission
		requested         bool
		wantRotated       bool
	}{
		{"kept grant", withMcp, withMcp, true, false},
		{"never held", without, without, true, false},
		{"lost, kept by request", withMcp, without, false, false},
		{"lost, rotation requested", withMcp, without, true, true},
		{"deleted, rotation requested", withMcp, nil, true, true},
	}
	for _, tc := range cases {
		calls = 0
		rotated, err := rotateAPIKeyIfLost(tc.previous, tc.current, tc.requested)
		if err != nil {
			t.Fatalf("%s: %v", tc.name, err)
		}
		if rotated != tc.wantRotated || calls != map[bool]int{false: 0, true: 1}[tc.wantRotated] {
			t.Fatalf("%s: rotated=%v calls=%d", tc.name, rotated, calls)
		}
	}

	failing = true
	if rotated, err := rotateAPIKeyIfLost(withMcp, without, true); rotated || !errors.Is(err, errAPIKeyNotRotated) {
		t.Fatalf("failed rotation: rotated=%v err=%v", rotated, err)
	}
}

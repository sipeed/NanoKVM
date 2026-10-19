package vpnpref

import (
	"context"
	"testing"
)

func TestStageTokensKeepWinnerAndIgnoreOldFinish(t *testing.T) {
	if !TryLock() {
		t.Fatal("lifecycle lock busy")
	}
	defer Unlock()
	InvalidateStagedInstalls()
	oldContext, oldToken, oldFinish := BeginStagedInstall(context.Background())
	newContext, newToken, newFinish := BeginStagedInstall(context.Background())
	defer newFinish()
	if oldToken == newToken {
		t.Fatal("install tokens must be unique")
	}
	InvalidateOtherStagedInstalls(newToken)
	oldFinish()
	if oldContext.Err() == nil || StagedInstallCurrent(oldToken) {
		t.Fatal("older stage survived invalidation")
	}
	if newContext.Err() != nil || !StagedInstallCurrent(newToken) {
		t.Fatal("old finish invalidated the winning stage")
	}
	InvalidateStagedInstalls()
	if newContext.Err() == nil || StagedInstallCurrent(newToken) {
		t.Fatal("lifecycle action did not cancel winner")
	}
}

package application

import (
	"crypto/sha512"
	"encoding/base64"
	"testing"
)

func validLatest() Latest {
	digest := sha512.Sum512([]byte("package"))
	return Latest{
		Version: "1.2.3", Name: "nanokvm_1.2.3.tar.gz",
		Sha512: base64.StdEncoding.EncodeToString(digest[:]), LegacySize: 1,
	}
}

func TestValidateLatestV1DoesNotInterpretLegacySizeAsBytes(t *testing.T) {
	latest := validLatest()
	latest.LegacySize = 15048 // historic stable manifests used a non-byte value
	if err := validateLatest(&latest); err != nil {
		t.Fatal(err)
	}
	if err := validateDownloadedSize(&latest, 15406125); err != nil {
		t.Fatalf("v1 must not require equality with legacy size: %v", err)
	}
}

func TestValidateLatestV2RequiresExactByteFields(t *testing.T) {
	latest := validLatest()
	latest.ManifestVersion = 2
	latest.SizeBytes = 100
	latest.UnpackedSizeBytes = 200
	if err := validateLatest(&latest); err != nil {
		t.Fatal(err)
	}
	if err := validateDownloadedSize(&latest, 99); err == nil {
		t.Fatal("v2 size mismatch was accepted")
	}
	if err := validateExpandedSize(&latest, 199); err == nil {
		t.Fatal("v2 expanded size mismatch was accepted")
	}
	latest.ManifestVersion = 3
	if err := validateLatest(&latest); err == nil {
		t.Fatal("unknown manifest version was accepted")
	}
}

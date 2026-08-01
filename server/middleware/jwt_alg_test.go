package middleware

import (
	"testing"
	"time"

	"NanoKVM-Server/config"

	"github.com/golang-jwt/jwt/v5"
)

// signWith mints a token for the device's own secret using a chosen algorithm,
// which is what an attacker holding a leaked or guessed secret would do.
func signWith(t *testing.T, method jwt.SigningMethod) string {
	t.Helper()

	claims := Token{
		Username: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}

	signed, err := jwt.NewWithClaims(method, claims).
		SignedString([]byte(config.GetInstance().JWT.SecretKey))
	if err != nil {
		t.Fatalf("failed to sign token: %s", err)
	}

	return signed
}

func TestParseJWTAcceptsHS256(t *testing.T) {
	if _, err := ParseJWT(signWith(t, jwt.SigningMethodHS256)); err != nil {
		t.Fatalf("HS256 token should be accepted: %s", err)
	}
}

// The parser must accept only the algorithm the server issues. Taking whatever
// the token's own header asks for is how algorithm-confusion attacks start.
func TestParseJWTRejectsOtherHMACAlgorithms(t *testing.T) {
	for _, method := range []jwt.SigningMethod{jwt.SigningMethodHS384, jwt.SigningMethodHS512} {
		if _, err := ParseJWT(signWith(t, method)); err == nil {
			t.Fatalf("%s token should be rejected", method.Alg())
		}
	}
}

func TestParseJWTRejectsUnsignedToken(t *testing.T) {
	unsigned, err := jwt.NewWithClaims(jwt.SigningMethodNone, Token{
		Username: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to build unsigned token: %s", err)
	}

	if _, err := ParseJWT(unsigned); err == nil {
		t.Fatal("a token with alg=none should be rejected")
	}
}

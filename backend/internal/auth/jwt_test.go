package auth

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestJWTEncodeDecode(t *testing.T) {
	secret := []byte("test-secret")
	token, err := NewToken(secret, "user-123")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	parsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil || !parsed.Valid {
		t.Fatalf("expected jwt to parse: %v", err)
	}
	subject, err := ParseTokenSubject(secret, token)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if subject != "user-123" {
		t.Fatalf("expected subject user-123, got %s", subject)
	}
}

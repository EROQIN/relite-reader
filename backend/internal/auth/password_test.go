package auth

import (
	"strings"
	"testing"
)

func TestPasswordHashAndCheck(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if !strings.HasPrefix(hash, "$2") {
		t.Fatalf("expected bcrypt hash prefix, got %s", hash)
	}
	if ok := CheckPassword(hash, "secret123"); !ok {
		t.Fatalf("expected password to match")
	}
	if ok := CheckPassword(hash, "wrong"); ok {
		t.Fatalf("expected password mismatch")
	}
}

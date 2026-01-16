package auth

import "testing"

func TestPasswordHashAndCheck(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if ok := CheckPassword(hash, "secret123"); !ok {
		t.Fatalf("expected password to match")
	}
	if ok := CheckPassword(hash, "wrong"); ok {
		t.Fatalf("expected password mismatch")
	}
}

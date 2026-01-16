package auth

import "testing"

func TestJWTEncodeDecode(t *testing.T) {
	secret := []byte("test-secret")
	token, err := NewToken(secret, "user-123")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	subject, err := ParseTokenSubject(secret, token)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if subject != "user-123" {
		t.Fatalf("expected subject user-123, got %s", subject)
	}
}

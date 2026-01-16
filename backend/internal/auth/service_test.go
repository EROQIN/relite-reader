package auth

import (
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestRegisterAndLogin(t *testing.T) {
	store := users.NewMemoryStore()
	svc := NewService(store)

	user, err := svc.Register("reader@example.com", "secret123")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	_, err = svc.Login("reader@example.com", "secret123")
	if err != nil {
		t.Fatalf("unexpected login err: %v", err)
	}

	if user.Email != "reader@example.com" {
		t.Fatalf("unexpected email: %s", user.Email)
	}
}

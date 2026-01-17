package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/tasks"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestTasksHandlerRequiresAuth(t *testing.T) {
	store := tasks.NewMemoryStore()
	h := handlers.NewTasksHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestTasksHandlerListsTasks(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := tasks.NewMemoryStore()
	_, _ = store.Create(tasks.Task{UserID: user.ID, Type: "format", Status: tasks.StatusQueued})
	h := handlers.NewTasksHandler(secret, store)
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
}

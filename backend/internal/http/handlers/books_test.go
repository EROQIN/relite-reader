package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

type booksResponse struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Format     string `json:"format"`
	SourcePath string `json:"source_path"`
	Missing    bool   `json:"missing"`
}

func TestBooksHandlerRequiresAuth(t *testing.T) {
	store := books.NewMemoryStore()
	h := handlers.NewBooksHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/books", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestBooksHandlerListsBooks(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := books.NewMemoryStore()
	_, _ = store.Upsert(user.ID, books.Book{SourcePath: "/a.epub", Title: "A", Format: "epub"})
	_, _ = store.Upsert(user.ID, books.Book{SourcePath: "/b.pdf", Title: "B", Format: "pdf"})
	_ = store.MarkMissing(user.ID, []string{"/b.pdf"})

	h := handlers.NewBooksHandler(secret, store)
	req := httptest.NewRequest(http.MethodGet, "/api/books", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
	var payload []booksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(payload) != 2 {
		t.Fatalf("expected 2 books, got %d", len(payload))
	}
}

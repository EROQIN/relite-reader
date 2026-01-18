package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/bookmarks"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestBookmarksHandlerRequiresAuth(t *testing.T) {
	store := bookmarks.NewMemoryStore()
	h := handlers.NewBookmarksHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/bookmarks/book-1", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestBookmarksHandlerCreateAndList(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := bookmarks.NewMemoryStore()
	h := handlers.NewBookmarksHandler(secret, store)
	payload, _ := json.Marshal(map[string]any{"label": "Intro", "location": 0.12})
	createReq := httptest.NewRequest(http.MethodPost, "/api/bookmarks/book-1", bytes.NewReader(payload))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createResp := httptest.NewRecorder()
	h.ServeHTTP(createResp, createReq)
	if createResp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResp.Code)
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/bookmarks/book-1", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listResp := httptest.NewRecorder()
	h.ServeHTTP(listResp, listReq)
	if listResp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", listResp.Code)
	}
}

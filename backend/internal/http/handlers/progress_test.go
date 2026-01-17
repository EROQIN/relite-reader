package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/progress"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestProgressHandlerRequiresAuth(t *testing.T) {
	store := progress.NewMemoryStore()
	h := handlers.NewProgressHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/progress/book-1", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestProgressHandlerUpdateAndGet(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := progress.NewMemoryStore()
	h := handlers.NewProgressHandler(secret, store)

	body, _ := json.Marshal(map[string]float64{"location": 0.55})
	updateReq := httptest.NewRequest(http.MethodPut, "/api/progress/book-1", bytes.NewReader(body))
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateResp := httptest.NewRecorder()
	h.ServeHTTP(updateResp, updateReq)
	if updateResp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", updateResp.Code)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/progress/book-1", nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getResp := httptest.NewRecorder()
	h.ServeHTTP(getResp, getReq)
	if getResp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", getResp.Code)
	}
	var payload progress.Progress
	if err := json.NewDecoder(getResp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if payload.Location != 0.55 {
		t.Fatalf("expected 0.55, got %f", payload.Location)
	}
}

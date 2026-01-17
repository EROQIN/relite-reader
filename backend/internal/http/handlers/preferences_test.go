package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/preferences"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

type prefsResponse struct {
	Locale string                        `json:"locale"`
	Reader preferences.ReaderPreferences `json:"reader"`
}

func TestPreferencesHandlerRequiresAuth(t *testing.T) {
	store := preferences.NewMemoryStore()
	h := handlers.NewPreferencesHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/preferences", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestPreferencesHandlerGetDefaults(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := preferences.NewMemoryStore()
	h := handlers.NewPreferencesHandler(secret, store)
	req := httptest.NewRequest(http.MethodGet, "/api/preferences", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
	var payload prefsResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if payload.Locale != "en" {
		t.Fatalf("expected locale en, got %q", payload.Locale)
	}
	if payload.Reader.Theme == "" {
		t.Fatalf("expected theme, got empty")
	}
}

func TestPreferencesHandlerPutUpdates(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := preferences.NewMemoryStore()
	h := handlers.NewPreferencesHandler(secret, store)
	payload := preferences.UserPreferences{
		Locale: "zh-CN",
		Reader: preferences.ReaderPreferences{Theme: "night", FontSize: 20},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPut, "/api/preferences", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
	var updated prefsResponse
	if err := json.NewDecoder(resp.Body).Decode(&updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Locale != "zh-CN" {
		t.Fatalf("expected locale zh-CN, got %q", updated.Locale)
	}
	if updated.Reader.Theme != "night" {
		t.Fatalf("expected theme night, got %s", updated.Reader.Theme)
	}
	if updated.Reader.FontSize != 20 {
		t.Fatalf("expected fontSize 20, got %d", updated.Reader.FontSize)
	}
}

package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/bookmarks"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/preferences"
	"github.com/EROQIN/relite-reader/backend/internal/progress"
	"github.com/EROQIN/relite-reader/backend/internal/tasks"
	"github.com/EROQIN/relite-reader/backend/internal/users"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type stubClient struct{ err error }

func (s stubClient) List(_, _, _ string) ([]webdav.Entry, error) { return nil, s.err }

func TestWebDAVHandlersRequireAuth(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	webStore := webdav.NewMemoryStore()
	bookStore := books.NewMemoryStore()
	bookmarksStore := bookmarks.NewMemoryStore()
	prefsStore := preferences.NewMemoryStore()
	progressStore := progress.NewMemoryStore()
	tasksStore := tasks.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, stubClient{err: nil}, key, bookStore, nil)
	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt-secret"), webSvc, bookStore, bookmarksStore, prefsStore, progressStore, tasksStore, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/webdav", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestWebDAVCreateAndList(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	user, _ := authSvc.Register("reader@example.com", "secret")
	jwtSecret := []byte("jwt-secret")
	token, _ := auth.NewToken(jwtSecret, user.ID)

	webStore := webdav.NewMemoryStore()
	bookStore := books.NewMemoryStore()
	bookmarksStore := bookmarks.NewMemoryStore()
	prefsStore := preferences.NewMemoryStore()
	progressStore := progress.NewMemoryStore()
	tasksStore := tasks.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, stubClient{err: nil}, key, bookStore, nil)
	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc, bookStore, bookmarksStore, prefsStore, progressStore, tasksStore, nil)

	payload := map[string]string{"base_url": "https://dav.example.com", "username": "reader", "secret": "pw"}
	body, _ := json.Marshal(payload)
	createReq := httptest.NewRequest(http.MethodPost, "/api/webdav", bytes.NewReader(body))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createReq.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()
	router.ServeHTTP(createResp, createReq)
	if createResp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResp.Code)
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/webdav", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listResp := httptest.NewRecorder()
	router.ServeHTTP(listResp, listReq)
	if listResp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", listResp.Code)
	}
}

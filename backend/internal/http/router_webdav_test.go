package http_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/annotations"
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

type noopClient struct{}

func (noopClient) List(_, _, _ string) ([]webdav.Entry, error) { return nil, nil }

func (noopClient) Fetch(_, _, _, _ string) (io.ReadCloser, string, error) {
	return nil, "", nil
}

func TestRouterWithWebDAVRoutes(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	bookStore := books.NewMemoryStore()
	bookmarksStore := bookmarks.NewMemoryStore()
	prefsStore := preferences.NewMemoryStore()
	progressStore := progress.NewMemoryStore()
	tasksStore := tasks.NewMemoryStore()
	webStore := webdav.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, noopClient{}, key, bookStore, nil)

	annotationsStore := annotations.NewMemoryStore()
	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt"), webSvc, bookStore, annotationsStore, bookmarksStore, prefsStore, progressStore, tasksStore, nil)
	req := httptest.NewRequest(http.MethodGet, "/api/webdav", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code == http.StatusNotFound {
		t.Fatalf("expected route to exist")
	}
}

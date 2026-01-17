package http_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/users"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

func TestRouterWithBooksRoutes(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	bookStore := books.NewMemoryStore()
	webStore := webdav.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, noopClient{}, key, bookStore)

	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt"), webSvc, bookStore)
	req := httptest.NewRequest(http.MethodGet, "/api/books", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code == http.StatusNotFound {
		t.Fatalf("expected route to exist")
	}
}

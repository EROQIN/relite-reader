package http_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/users"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type noopClient struct{}

func (noopClient) List(_, _, _ string) ([]webdav.Entry, error) { return nil, nil }

func TestRouterWithWebDAVRoutes(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	webStore := webdav.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, noopClient{}, key, nil)

	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt"), webSvc)
	req := httptest.NewRequest(http.MethodGet, "/api/webdav", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code == http.StatusNotFound {
		t.Fatalf("expected route to exist")
	}
}

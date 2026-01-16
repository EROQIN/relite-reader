package http

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthRoute(t *testing.T) {
	router := NewRouter()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
	if got := resp.Body.String(); got == "" {
		t.Fatalf("expected body, got empty")
	}
}

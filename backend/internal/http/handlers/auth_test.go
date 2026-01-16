package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestRegisterAndLoginHandlers(t *testing.T) {
	store := users.NewMemoryStore()
	svc := auth.NewService(store)
	router := apphttp.NewRouterWithAuth(svc, []byte("test-secret"))

	payload := map[string]string{"email": "reader@example.com", "password": "secret123"}
	body, _ := json.Marshal(payload)

	regReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	regReq.Header.Set("Content-Type", "application/json")
	regResp := httptest.NewRecorder()
	router.ServeHTTP(regResp, regReq)
	if regResp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", regResp.Code)
	}

	loginReq := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	loginReq.Header.Set("Content-Type", "application/json")
	loginResp := httptest.NewRecorder()
	router.ServeHTTP(loginResp, loginReq)
	if loginResp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", loginResp.Code)
	}
}

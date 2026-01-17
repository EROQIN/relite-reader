# WebDAV Connections & Sync Implementation Plan

**Goal:** Add WebDAV connection CRUD with encrypted secrets plus manual/periodic sync hooks in the Go backend.

**Architecture:** Introduce a `webdav` package with crypto helpers, an in-memory store, a client interface, and a service that handles validation and sync status updates. Add HTTP handlers with JWT auth enforcement and wire routes into the server.

**Tech Stack:** Go (net/http), JWT (existing), AES-GCM (crypto/aes), in-memory store (sync.Mutex), optional WebDAV client adapter.

### Task 1: WebDAV crypto helpers (AES-GCM)

**Files:**
- Create: `backend/internal/webdav/crypto.go`
- Create: `backend/internal/webdav/crypto_test.go`

**Step 1: Write the failing test**

```go
package webdav

import "testing"

func TestEncryptDecryptSecretRoundTrip(t *testing.T) {
	key, err := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	if err != nil {
		t.Fatalf("parse key: %v", err)
	}
	ciphertext, err := EncryptSecret(key, "super-secret")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	plaintext, err := DecryptSecret(key, ciphertext)
	if err != nil {
		t.Fatalf("decrypt: %v", err)
	}
	if plaintext != "super-secret" {
		t.Fatalf("expected secret round-trip, got %q", plaintext)
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestEncryptDecryptSecretRoundTrip`
Expected: FAIL with undefined ParseKey/EncryptSecret/DecryptSecret

**Step 3: Write minimal implementation**

```go
package webdav

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
)

func ParseKey(raw string) ([]byte, error) {
	if len(raw) == 64 {
		if decoded, err := hex.DecodeString(raw); err == nil {
			if len(decoded) != 32 {
				return nil, errors.New("invalid key length")
			}
			return decoded, nil
		}
	}
	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return nil, err
	}
	if len(decoded) != 32 {
		return nil, errors.New("invalid key length")
	}
	return decoded, nil
}

func EncryptSecret(key []byte, secret string) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	ciphertext := gcm.Seal(nil, nonce, []byte(secret), nil)
	return append(nonce, ciphertext...), nil
}

func DecryptSecret(key []byte, payload []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(payload) < nonceSize {
		return "", errors.New("payload too short")
	}
	nonce := payload[:nonceSize]
	ciphertext := payload[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestEncryptDecryptSecretRoundTrip`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/crypto.go backend/internal/webdav/crypto_test.go
git commit -m "feat: add webdav secret encryption helpers"
```

### Task 2: WebDAV connection store (in-memory)

**Files:**
- Create: `backend/internal/webdav/store.go`
- Create: `backend/internal/webdav/memory_store.go`
- Create: `backend/internal/webdav/memory_store_test.go`

**Step 1: Write the failing test**

```go
package webdav

import "testing"

func TestMemoryStoreCRUD(t *testing.T) {
	store := NewMemoryStore()
	conn, err := store.Create("user-1", Connection{
		BaseURL: "https://dav.example.com",
		Username: "reader",
		EncryptedSecret: []byte("secret"),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatalf("expected id")
	}
	list, _ := store.ListByUser("user-1")
	if len(list) != 1 {
		t.Fatalf("expected 1 connection, got %d", len(list))
	}
	conn.BaseURL = "https://dav2.example.com"
	updated, err := store.Update("user-1", conn)
	if err != nil || updated.BaseURL != "https://dav2.example.com" {
		t.Fatalf("update failed")
	}
	if err := store.Delete("user-1", conn.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestMemoryStoreCRUD`
Expected: FAIL with undefined NewMemoryStore/Connection

**Step 3: Write minimal implementation**

```go
package webdav

import "errors"

var ErrNotFound = errors.New("webdav connection not found")

type Connection struct {
	ID             string
	UserID         string
	BaseURL        string
	Username       string
	EncryptedSecret []byte
	LastSyncStatus string
	LastError      string
}

type Store interface {
	Create(userID string, conn Connection) (Connection, error)
	ListByUser(userID string) ([]Connection, error)
	GetByID(userID, id string) (Connection, error)
	Update(userID string, conn Connection) (Connection, error)
	Delete(userID, id string) error
	UpdateSyncStatus(userID, id, status, lastError string) (Connection, error)
}
```

```go
package webdav

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
)

type MemoryStore struct {
	mu    sync.Mutex
	items map[string]map[string]Connection
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Connection)}
}

func (s *MemoryStore) Create(userID string, conn Connection) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn.ID = newID()
	conn.UserID = userID
	if s.items[userID] == nil {
		s.items[userID] = make(map[string]Connection)
	}
	s.items[userID][conn.ID] = conn
	return conn, nil
}

func (s *MemoryStore) ListByUser(userID string) ([]Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Connection
	for _, conn := range s.items[userID] {
		out = append(out, conn)
	}
	return out, nil
}

func (s *MemoryStore) GetByID(userID, id string) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn, ok := s.items[userID][id]
	if !ok {
		return Connection{}, ErrNotFound
	}
	return conn, nil
}

func (s *MemoryStore) Update(userID string, conn Connection) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[userID][conn.ID]; !ok {
		return Connection{}, ErrNotFound
	}
	s.items[userID][conn.ID] = conn
	return conn, nil
}

func (s *MemoryStore) Delete(userID, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[userID][id]; !ok {
		return ErrNotFound
	}
	delete(s.items[userID], id)
	return nil
}

func (s *MemoryStore) UpdateSyncStatus(userID, id, status, lastError string) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn, ok := s.items[userID][id]
	if !ok {
		return Connection{}, ErrNotFound
	}
	conn.LastSyncStatus = status
	conn.LastError = lastError
	s.items[userID][id] = conn
	return conn, nil
}

func newID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestMemoryStoreCRUD`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/store.go backend/internal/webdav/memory_store.go backend/internal/webdav/memory_store_test.go
git commit -m "feat: add in-memory webdav connection store"
```

### Task 3: WebDAV service with client validation

**Files:**
- Create: `backend/internal/webdav/client.go`
- Create: `backend/internal/webdav/service.go`
- Create: `backend/internal/webdav/service_test.go`

**Step 1: Write the failing test**

```go
package webdav

import "testing"

type fakeClient struct{ err error }

func (f fakeClient) List(_ string, _ string, _ string) error { return f.err }

func TestServiceCreateValidatesClient(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key)
	conn, err := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatalf("expected id")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestServiceCreateValidatesClient`
Expected: FAIL with undefined NewService/Create

**Step 3: Write minimal implementation**

```go
package webdav

import "errors"

type Client interface {
	List(baseURL, username, secret string) error
}

type NoopClient struct{}

func (NoopClient) List(_, _, _ string) error { return nil }

type Service struct {
	store  Store
	client Client
	key    []byte
}

func NewService(store Store, client Client, key []byte) *Service {
	return &Service{store: store, client: client, key: key}
}

func (s *Service) Create(userID, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	encrypted, err := EncryptSecret(s.key, secret)
	if err != nil {
		return Connection{}, err
	}
	return s.store.Create(userID, Connection{
		BaseURL:         baseURL,
		Username:        username,
		EncryptedSecret: encrypted,
		LastSyncStatus:  "never",
	})
}

func (s *Service) List(userID string) ([]Connection, error) {
	return s.store.ListByUser(userID)
}

func (s *Service) Update(userID, id, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	encrypted, err := EncryptSecret(s.key, secret)
	if err != nil {
		return Connection{}, err
	}
	conn, err := s.store.GetByID(userID, id)
	if err != nil {
		return Connection{}, err
	}
	conn.BaseURL = baseURL
	conn.Username = username
	conn.EncryptedSecret = encrypted
	return s.store.Update(userID, conn)
}

func (s *Service) Delete(userID, id string) error {
	return s.store.Delete(userID, id)
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestServiceCreateValidatesClient`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/client.go backend/internal/webdav/service.go backend/internal/webdav/service_test.go
git commit -m "feat: add webdav service with validation"
```

### Task 4: Sync behavior (update status)

**Files:**
- Modify: `backend/internal/webdav/service.go`
- Modify: `backend/internal/webdav/service_test.go`

**Step 1: Write the failing test**

```go
func TestServiceSyncUpdatesStatus(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key)
	conn, _ := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err := svc.Sync("user-1", conn.ID); err != nil {
		t.Fatalf("sync: %v", err)
	}
	updated, _ := store.GetByID("user-1", conn.ID)
	if updated.LastSyncStatus != "success" {
		t.Fatalf("expected success status")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestServiceSyncUpdatesStatus`
Expected: FAIL with undefined Sync

**Step 3: Write minimal implementation**

```go
func (s *Service) Sync(userID, id string) error {
	conn, err := s.store.GetByID(userID, id)
	if err != nil {
		return err
	}
	secret, err := DecryptSecret(s.key, conn.EncryptedSecret)
	if err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "decrypt failed")
		return err
	}
	if err := s.client.List(conn.BaseURL, conn.Username, secret); err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "sync failed")
		return err
	}
	_, err = s.store.UpdateSyncStatus(userID, id, "success", "")
	return err
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/webdav -run TestServiceSyncUpdatesStatus`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/service.go backend/internal/webdav/service_test.go
git commit -m "feat: add webdav sync status updates"
```

### Task 5: WebDAV HTTP handlers (CRUD + sync)

**Files:**
- Create: `backend/internal/http/handlers/webdav.go`
- Create: `backend/internal/http/handlers/webdav_test.go`

**Step 1: Write the failing test**

```go
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
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type stubClient struct{ err error }

func (s stubClient) List(_, _, _ string) error { return s.err }

func TestWebDAVHandlersRequireAuth(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	webStore := webdav.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, stubClient{err: nil}, key)
	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt-secret"), webSvc)

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
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, stubClient{err: nil}, key)
	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc)

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
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/http/handlers -run TestWebDAV`
Expected: FAIL with undefined NewRouterWithAuthAndWebDAV/WebDAV handler

**Step 3: Write minimal implementation**

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type WebDAVHandler struct {
	secret []byte
	svc    *webdav.Service
}

type webdavPayload struct {
	BaseURL string `json:"base_url"`
	Username string `json:"username"`
	Secret string `json:"secret"`
}

type webdavResponse struct {
	ID string `json:"id"`
	BaseURL string `json:"base_url"`
	Username string `json:"username"`
	LastSyncStatus string `json:"last_sync_status"`
	LastError string `json:"last_error"`
}

func NewWebDAVHandler(secret []byte, svc *webdav.Service) *WebDAVHandler {
	return &WebDAVHandler{secret: secret, svc: svc}
}

func (h *WebDAVHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	switch {
	case r.URL.Path == "/api/webdav":
		switch r.Method {
		case http.MethodGet:
			h.handleList(w, r, userID)
		case http.MethodPost:
			h.handleCreate(w, r, userID)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	case strings.HasPrefix(r.URL.Path, "/api/webdav/"):
		h.handleItem(w, r, userID)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func (h *WebDAVHandler) handleCreate(w http.ResponseWriter, r *http.Request, userID string) {
	var payload webdavPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	conn, err := h.svc.Create(userID, payload.BaseURL, payload.Username, payload.Secret)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusCreated, toWebDAVResponse(conn))
}

func (h *WebDAVHandler) handleList(w http.ResponseWriter, r *http.Request, userID string) {
	conns, err := h.svc.List(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var resp []webdavResponse
	for _, conn := range conns {
		resp = append(resp, toWebDAVResponse(conn))
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *WebDAVHandler) handleItem(w http.ResponseWriter, r *http.Request, userID string) {
	path := strings.TrimPrefix(r.URL.Path, "/api/webdav/")
	parts := strings.Split(path, "/")
	id := parts[0]
	if id == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if len(parts) == 2 && parts[1] == "sync" && r.Method == http.MethodPost {
		_ = h.svc.Sync(userID, id)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	switch r.Method {
	case http.MethodPut:
		var payload webdavPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		conn, err := h.svc.Update(userID, id, payload.BaseURL, payload.Username, payload.Secret)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		writeJSON(w, http.StatusOK, toWebDAVResponse(conn))
	case http.MethodDelete:
		if err := h.svc.Delete(userID, id); err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func requireUserID(r *http.Request, secret []byte) (string, bool) {
	authorization := r.Header.Get("Authorization")
	if authorization == "" {
		return "", false
	}
	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 {
		return "", false
	}
	sub, err := auth.ParseTokenSubject(secret, parts[1])
	if err != nil {
		return "", false
	}
	return sub, true
}

func toWebDAVResponse(conn webdav.Connection) webdavResponse {
	return webdavResponse{
		ID: conn.ID,
		BaseURL: conn.BaseURL,
		Username: conn.Username,
		LastSyncStatus: conn.LastSyncStatus,
		LastError: conn.LastError,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/http/handlers -run TestWebDAV`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/http/handlers/webdav.go backend/internal/http/handlers/webdav_test.go
git commit -m "feat: add webdav handlers"
```

### Task 6: Wire router + main config

**Files:**
- Modify: `backend/internal/http/router.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Write the failing test**

```go
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

func (noopClient) List(_, _, _ string) error { return nil }

func TestRouterWithWebDAVRoutes(t *testing.T) {
	store := users.NewMemoryStore()
	authSvc := auth.NewService(store)
	webStore := webdav.NewMemoryStore()
	key, _ := webdav.ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	webSvc := webdav.NewService(webStore, noopClient{}, key)

	router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, []byte("jwt"), webSvc)
	req := httptest.NewRequest(http.MethodGet, "/api/webdav", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code == http.StatusNotFound {
		t.Fatalf("expected route to exist")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/http -run TestRouterWithWebDAVRoutes`
Expected: FAIL with undefined NewRouterWithAuthAndWebDAV

**Step 3: Write minimal implementation**

```go
func NewRouterWithAuthAndWebDAV(svc *auth.Service, secret []byte, webSvc *webdav.Service) http.Handler {
	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(svc, secret)
	webHandler := handlers.NewWebDAVHandler(secret, webSvc)
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.Handle("/api/webdav", webHandler)
	mux.Handle("/api/webdav/", webHandler)
	return mux
}
```

Update `backend/cmd/server/main.go` to build auth + webdav deps:

```go
jwtSecret := []byte(os.Getenv("RELITE_JWT_SECRET"))
key, err := webdav.ParseKey(os.Getenv("RELITE_WEB_DAV_KEY"))
// fatal on missing/invalid
userStore := users.NewMemoryStore()
authSvc := auth.NewService(userStore)
webStore := webdav.NewMemoryStore()
webSvc := webdav.NewService(webStore, webdav.NoopClient{}, key)
router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc)
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./backend/internal/http -run TestRouterWithWebDAVRoutes`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/http/router.go backend/cmd/server/main.go
git commit -m "feat: wire webdav routes into server"
```

### Task 7: Full backend verification

**Files:**
- Modify: none

**Step 1: Run full backend test suite**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync/.cache/go-build go test ./...`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify webdav backend"
```

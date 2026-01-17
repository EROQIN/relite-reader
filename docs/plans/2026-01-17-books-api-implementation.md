# Books API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an authenticated `/api/books` endpoint that lists the user’s indexed books.

**Architecture:** Introduce a BooksHandler that reads the authenticated user ID and returns `books.Store.ListByUser`. Extract shared handler helpers (auth extraction + JSON response) so WebDAV and Books handlers reuse them. Wire `/api/books` into the router and `main`.

**Tech Stack:** Go (net/http, encoding/json), existing auth/webdav/books stores.

### Task 1: Books handler (auth + list)

**Files:**
- Create: `backend/internal/http/handlers/books.go`
- Create: `backend/internal/http/handlers/books_test.go`
- Create: `backend/internal/http/handlers/helpers.go`
- Modify: `backend/internal/http/handlers/webdav.go`

**Step 1: Write the failing test**

```go
package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/users"
)

type booksResponse struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Format     string `json:"format"`
	SourcePath string `json:"source_path"`
	Missing    bool   `json:"missing"`
}

func TestBooksHandlerRequiresAuth(t *testing.T) {
	store := books.NewMemoryStore()
	h := handlers.NewBooksHandler([]byte("jwt"), store)
	req := httptest.NewRequest(http.MethodGet, "/api/books", nil)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.Code)
	}
}

func TestBooksHandlerListsBooks(t *testing.T) {
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	user, _ := authSvc.Register("reader@example.com", "secret")
	secret := []byte("jwt")
	token, _ := auth.NewToken(secret, user.ID)

	store := books.NewMemoryStore()
	_, _ = store.Upsert(user.ID, books.Book{SourcePath: "/a.epub", Title: "A", Format: "epub"})
	_, _ = store.Upsert(user.ID, books.Book{SourcePath: "/b.pdf", Title: "B", Format: "pdf"})
	_ = store.MarkMissing(user.ID, []string{"/b.pdf"})

	h := handlers.NewBooksHandler(secret, store)
	req := httptest.NewRequest(http.MethodGet, "/api/books", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}
	var payload []booksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(payload) != 2 {
		t.Fatalf("expected 2 books, got %d", len(payload))
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/books-api/.cache/go-build go test ./internal/http/handlers -run TestBooksHandler`
Expected: FAIL with undefined NewBooksHandler

**Step 3: Write minimal implementation**

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/books"
)

type BooksHandler struct {
	secret []byte
	store  books.Store
}

type booksResponse struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Author     string    `json:"author"`
	Format     string    `json:"format"`
	SourcePath string    `json:"source_path"`
	Missing    bool      `json:"missing"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func NewBooksHandler(secret []byte, store books.Store) *BooksHandler {
	return &BooksHandler{secret: secret, store: store}
}

func (h *BooksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if r.Method != http.MethodGet || r.URL.Path != "/api/books" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	list, err := h.store.ListByUser(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	resp := make([]booksResponse, 0, len(list))
	for _, book := range list {
		resp = append(resp, booksResponse{
			ID:         book.ID,
			Title:      book.Title,
			Author:     book.Author,
			Format:     book.Format,
			SourcePath: book.SourcePath,
			Missing:    book.Missing,
			UpdatedAt:  book.UpdatedAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}
```

Create shared helpers and update WebDAV handler to use them:

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
)

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

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
```

Remove duplicated helper functions from `webdav.go`.

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/books-api/.cache/go-build go test ./internal/http/handlers -run TestBooksHandler`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/http/handlers/books.go backend/internal/http/handlers/books_test.go backend/internal/http/handlers/helpers.go backend/internal/http/handlers/webdav.go
git commit -m "feat: add books handler"
```

### Task 2: Router wiring

**Files:**
- Modify: `backend/internal/http/router.go`
- Modify: `backend/internal/http/router_webdav_test.go`
- Create: `backend/internal/http/router_books_test.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `backend/internal/http/handlers/webdav_test.go`

**Step 1: Write the failing test**

```go
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

type noopClient struct{}

func (noopClient) List(_, _, _ string) ([]webdav.Entry, error) { return nil, nil }

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
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/books-api/.cache/go-build go test ./internal/http -run TestRouterWithBooksRoutes`
Expected: FAIL with NewRouterWithAuthAndWebDAV signature mismatch

**Step 3: Write minimal implementation**

Update router signature and wiring:

```go
func NewRouterWithAuthAndWebDAV(svc *auth.Service, secret []byte, webSvc *webdav.Service, booksStore books.Store) http.Handler {
	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(svc, secret)
	webHandler := handlers.NewWebDAVHandler(secret, webSvc)
	booksHandler := handlers.NewBooksHandler(secret, booksStore)
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.Handle("/api/webdav", webHandler)
	mux.Handle("/api/webdav/", webHandler)
	mux.Handle("/api/books", booksHandler)
	return mux
}
```

Update call sites:

```go
bookStore := books.NewMemoryStore()
webSvc := webdav.NewService(webStore, webdav.NoopClient{}, key, bookStore)
router := apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc, bookStore)
```

Adjust existing tests (`router_webdav_test.go`, `handlers/webdav_test.go`) to pass `booksStore`.

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/books-api/.cache/go-build go test ./internal/http -run TestRouterWithBooksRoutes`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/http/router.go backend/internal/http/router_webdav_test.go backend/internal/http/router_books_test.go backend/cmd/server/main.go backend/internal/http/handlers/webdav_test.go
git commit -m "feat: wire books routes"
```

### Task 3: Full backend verification

**Files:**
- Modify: none

**Step 1: Run full backend test suite**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/books-api/.cache/go-build go test ./...`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify books api"
```

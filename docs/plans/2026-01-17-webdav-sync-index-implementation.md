# WebDAV Sync & Book Index Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal book index that syncs from WebDAV listings and runs on a periodic scheduler.

**Architecture:** Extend the WebDAV client to return entries, add an in-memory books store, and update the WebDAV service to upsert books + mark missing. Add a simple scheduler that calls `SyncAll` on a ticker, wired in `main` with a configurable interval.

**Tech Stack:** Go (net/http, time, context), in-memory stores, existing JWT/auth/webdav packages.

### Task 1: Books store (in-memory)

**Files:**
- Create: `backend/internal/books/store.go`
- Create: `backend/internal/books/memory_store.go`
- Create: `backend/internal/books/memory_store_test.go`

**Step 1: Write the failing test**

```go
package books

import "testing"

func TestMemoryStoreUpsertAndMarkMissing(t *testing.T) {
	store := NewMemoryStore()
	_, err := store.Upsert("user-1", Book{SourcePath: "/a.epub", Title: "A", Format: "epub"})
	if err != nil {
		t.Fatalf("upsert: %v", err)
	}
	_, err = store.Upsert("user-1", Book{SourcePath: "/b.pdf", Title: "B", Format: "pdf"})
	if err != nil {
		t.Fatalf("upsert: %v", err)
	}
	list, _ := store.ListByUser("user-1")
	if len(list) != 2 {
		t.Fatalf("expected 2 books, got %d", len(list))
	}
	if err := store.MarkMissing("user-1", []string{"/b.pdf"}); err != nil {
		t.Fatalf("mark missing: %v", err)
	}
	missing, err := store.GetBySourcePath("user-1", "/b.pdf")
	if err != nil {
		t.Fatalf("get by source path: %v", err)
	}
	if !missing.Missing {
		t.Fatalf("expected missing to be true")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/books -run TestMemoryStoreUpsertAndMarkMissing`
Expected: FAIL with undefined symbols

**Step 3: Write minimal implementation**

```go
package books

import (
	"errors"
	"time"
)

type Book struct {
	ID         string
	UserID     string
	Title      string
	Author     string
	Format     string
	SourcePath string
	Missing    bool
	UpdatedAt  time.Time
}

var ErrNotFound = errors.New("book not found")

type Store interface {
	Upsert(userID string, book Book) (Book, error)
	ListByUser(userID string) ([]Book, error)
	GetBySourcePath(userID, sourcePath string) (Book, error)
	MarkMissing(userID string, missing []string) error
}
```

```go
package books

import (
	"fmt"
	"sync"
	"time"
)

type MemoryStore struct {
	mu     sync.Mutex
	items  map[string]map[string]Book
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Book)}
}

func (s *MemoryStore) Upsert(userID string, book Book) (Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[userID] == nil {
		s.items[userID] = make(map[string]Book)
	}
	book.UserID = userID
	book.UpdatedAt = time.Now()
	if existing, ok := s.items[userID][book.SourcePath]; ok {
		book.ID = existing.ID
	} else {
		s.nextID++
		book.ID = fmt.Sprintf("b-%d", s.nextID)
	}
	s.items[userID][book.SourcePath] = book
	return book, nil
}

func (s *MemoryStore) ListByUser(userID string) ([]Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Book
	for _, book := range s.items[userID] {
		out = append(out, book)
	}
	return out, nil
}

func (s *MemoryStore) GetBySourcePath(userID, sourcePath string) (Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	book, ok := s.items[userID][sourcePath]
	if !ok {
		return Book{}, ErrNotFound
	}
	return book, nil
}

func (s *MemoryStore) MarkMissing(userID string, missing []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, path := range missing {
		book, ok := s.items[userID][path]
		if !ok {
			continue
		}
		book.Missing = true
		book.UpdatedAt = time.Now()
		s.items[userID][path] = book
	}
	return nil
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/books -run TestMemoryStoreUpsertAndMarkMissing`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/books/store.go backend/internal/books/memory_store.go backend/internal/books/memory_store_test.go
git commit -m "feat: add in-memory books store"
```

### Task 2: WebDAV store enhancements (ListAll + LastSyncAt)

**Files:**
- Modify: `backend/internal/webdav/store.go`
- Modify: `backend/internal/webdav/memory_store.go`
- Modify: `backend/internal/webdav/memory_store_test.go`

**Step 1: Write the failing test**

```go
func TestMemoryStoreListAll(t *testing.T) {
	store := NewMemoryStore()
	_, _ = store.Create("user-1", Connection{BaseURL: "https://a.example", Username: "a"})
	_, _ = store.Create("user-2", Connection{BaseURL: "https://b.example", Username: "b"})
	list, _ := store.ListAll()
	if len(list) != 2 {
		t.Fatalf("expected 2 connections, got %d", len(list))
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestMemoryStoreListAll`
Expected: FAIL with undefined ListAll

**Step 3: Write minimal implementation**

```go
package webdav

import (
	"errors"
	"time"
)

// ...

type Connection struct {
	ID              string
	UserID          string
	BaseURL         string
	Username        string
	EncryptedSecret []byte
	LastSyncStatus  string
	LastError       string
	LastSyncAt      time.Time
}

// ...

type Store interface {
	Create(userID string, conn Connection) (Connection, error)
	ListByUser(userID string) ([]Connection, error)
	ListAll() ([]Connection, error)
	GetByID(userID, id string) (Connection, error)
	Update(userID string, conn Connection) (Connection, error)
	Delete(userID, id string) error
	UpdateSyncStatus(userID, id, status, lastError string) (Connection, error)
}
```

```go
func (s *MemoryStore) ListAll() ([]Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Connection
	for _, userItems := range s.items {
		for _, conn := range userItems {
			out = append(out, conn)
		}
	}
	return out, nil
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
	conn.LastSyncAt = time.Now()
	s.items[userID][id] = conn
	return conn, nil
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestMemoryStoreListAll`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/store.go backend/internal/webdav/memory_store.go backend/internal/webdav/memory_store_test.go
git commit -m "feat: add webdav store ListAll and sync timestamp"
```

### Task 3: WebDAV client entries

**Files:**
- Modify: `backend/internal/webdav/client.go`
- Modify: `backend/internal/webdav/service.go`
- Modify: `backend/internal/webdav/service_test.go`
- Modify: `backend/internal/http/handlers/webdav_test.go`
- Modify: `backend/internal/http/router_webdav_test.go`

**Step 1: Write the failing test**

```go
func TestServiceCreateValidatesClient(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key, nil)
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

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestServiceCreateValidatesClient`
Expected: FAIL with signature mismatch

**Step 3: Write minimal implementation**

```go
package webdav

import "time"

type Entry struct {
	Path    string
	Size    int64
	ModTime time.Time
}

type Client interface {
	List(baseURL, username, secret string) ([]Entry, error)
}

type NoopClient struct{}

func (NoopClient) List(_, _, _ string) ([]Entry, error) { return nil, nil }
```

```go
func (s *Service) Create(userID, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if _, err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	// ...
}

func (s *Service) Update(userID, id, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if _, err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	// ...
}
```

Update fake client signatures in tests and handlers:

```go
type fakeClient struct{ err error }

func (f fakeClient) List(_, _, _ string) ([]Entry, error) { return nil, f.err }
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestServiceCreateValidatesClient`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/client.go backend/internal/webdav/service.go backend/internal/webdav/service_test.go backend/internal/http/handlers/webdav_test.go backend/internal/http/router_webdav_test.go
git commit -m "feat: return entries from webdav client"
```

### Task 4: Sync indexing + SyncAll

**Files:**
- Modify: `backend/internal/webdav/service.go`
- Modify: `backend/internal/webdav/service_test.go`
- Modify: `backend/internal/http/handlers/webdav_test.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `backend/internal/http/router_webdav_test.go`

**Step 1: Write the failing test**

```go
func TestServiceSyncIndexesBooks(t *testing.T) {
	store := NewMemoryStore()
	booksStore := books.NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	client := fakeClient{entries: []Entry{{Path: "/library/A.epub"}, {Path: "/library/B.pdf"}}}
	svc := NewService(store, client, key, booksStore)
	conn, _ := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	_, _ = booksStore.Upsert("user-1", books.Book{SourcePath: "/library/OLD.txt", Title: "OLD"})
	if err := svc.Sync("user-1", conn.ID); err != nil {
		t.Fatalf("sync: %v", err)
	}
	list, _ := booksStore.ListByUser("user-1")
	if len(list) != 3 {
		t.Fatalf("expected 3 books, got %d", len(list))
	}
	missing, _ := booksStore.GetBySourcePath("user-1", "/library/OLD.txt")
	if !missing.Missing {
		t.Fatalf("expected old entry marked missing")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestServiceSyncIndexesBooks`
Expected: FAIL with missing books usage

**Step 3: Write minimal implementation**

```go
package webdav

import (
	"path"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/books"
)

type Service struct {
	store  Store
	client Client
	key    []byte
	books  books.Store
}

func NewService(store Store, client Client, key []byte, booksStore books.Store) *Service {
	return &Service{store: store, client: client, key: key, books: booksStore}
}

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
	entries, err := s.client.List(conn.BaseURL, conn.Username, secret)
	if err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "sync failed")
		return err
	}
	if s.books != nil {
		present := make(map[string]struct{})
		for _, entry := range entries {
			present[entry.Path] = struct{}{}
			_ = s.upsertBookFromEntry(userID, entry)
		}
		missing := s.computeMissing(userID, present)
		_ = s.books.MarkMissing(userID, missing)
	}
	_, err = s.store.UpdateSyncStatus(userID, id, "success", "")
	return err
}

func (s *Service) SyncAll() error {
	conns, err := s.store.ListAll()
	if err != nil {
		return err
	}
	var lastErr error
	for _, conn := range conns {
		if err := s.Sync(conn.UserID, conn.ID); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

func (s *Service) upsertBookFromEntry(userID string, entry Entry) error {
	base := path.Base(entry.Path)
	ext := strings.ToLower(path.Ext(base))
	title := strings.TrimSuffix(base, ext)
	format := strings.TrimPrefix(ext, ".")
	_, err := s.books.Upsert(userID, books.Book{
		Title:      title,
		Format:     format,
		SourcePath: entry.Path,
	})
	return err
}

func (s *Service) computeMissing(userID string, present map[string]struct{}) []string {
	list, err := s.books.ListByUser(userID)
	if err != nil {
		return nil
	}
	var missing []string
	for _, book := range list {
		if _, ok := present[book.SourcePath]; !ok {
			missing = append(missing, book.SourcePath)
		}
	}
	return missing
}
```

Update fake client in tests:

```go
type fakeClient struct{
	err     error
	entries []Entry
}

func (f fakeClient) List(_, _, _ string) ([]Entry, error) { return f.entries, f.err }
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestServiceSyncIndexesBooks`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/service.go backend/internal/webdav/service_test.go backend/cmd/server/main.go backend/internal/http/router_webdav_test.go backend/internal/http/handlers/webdav_test.go
git commit -m "feat: sync webdav listings into book index"
```

### Task 5: Scheduler wiring

**Files:**
- Create: `backend/internal/webdav/scheduler.go`
- Create: `backend/internal/webdav/scheduler_test.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Write the failing test**

```go
package webdav

import (
	"context"
	"testing"
	"time"
)

type fakeSyncer struct{ calls int }

func (f *fakeSyncer) SyncAll() error { f.calls++; return nil }

func TestSchedulerCallsSyncAll(t *testing.T) {
	ch := make(chan time.Time, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	fs := &fakeSyncer{}
	s := NewScheduler(fs, ch)
	go s.Start(ctx)
	ch <- time.Now()
	if fs.calls == 0 {
		t.Fatalf("expected sync call")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestSchedulerCallsSyncAll`
Expected: FAIL with undefined NewScheduler

**Step 3: Write minimal implementation**

```go
package webdav

import (
	"context"
	"time"
)

type Syncer interface {
	SyncAll() error
}

type Scheduler struct {
	syncer Syncer
	tick   <-chan time.Time
}

func NewScheduler(syncer Syncer, tick <-chan time.Time) *Scheduler {
	return &Scheduler{syncer: syncer, tick: tick}
}

func (s *Scheduler) Start(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-s.tick:
			_ = s.syncer.SyncAll()
		}
	}
}
```

Wire scheduler in `main`:

```go
interval := 20 * time.Minute
if raw := os.Getenv("RELITE_WEB_DAV_SYNC_INTERVAL"); raw != "" {
	duration, err := time.ParseDuration(raw)
	if err != nil {
		log.Fatal("invalid RELITE_WEB_DAV_SYNC_INTERVAL")
	}
	interval = duration
}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go webdav.NewScheduler(webSvc, ticker.C).Start(ctx)
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./internal/webdav -run TestSchedulerCallsSyncAll`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/scheduler.go backend/internal/webdav/scheduler_test.go backend/cmd/server/main.go
git commit -m "feat: schedule periodic webdav sync"
```

### Task 6: Full backend verification

**Files:**
- Modify: none

**Step 1: Run full backend test suite**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-sync-index/.cache/go-build go test ./...`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify webdav sync index"
```

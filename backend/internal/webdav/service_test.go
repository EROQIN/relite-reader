package webdav

import (
	"io"
	"testing"

	"github.com/EROQIN/relite-reader/backend/internal/books"
)

type fakeClient struct {
	err     error
	entries []Entry
}

func (f fakeClient) List(_ string, _ string, _ string) ([]Entry, error) {
	return f.entries, f.err
}

func (f fakeClient) Fetch(_, _, _, _ string) (io.ReadCloser, string, error) {
	return nil, "", f.err
}

func TestServiceCreateValidatesClient(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key, nil, nil)
	conn, err := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatalf("expected id")
	}
}

func TestServiceSyncUpdatesStatus(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key, nil, nil)
	conn, _ := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err := svc.Sync("user-1", conn.ID); err != nil {
		t.Fatalf("sync: %v", err)
	}
	updated, _ := store.GetByID("user-1", conn.ID)
	if updated.LastSyncStatus != "success" {
		t.Fatalf("expected success status")
	}
}

func TestServiceSyncIndexesBooks(t *testing.T) {
	store := NewMemoryStore()
	booksStore := books.NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	client := fakeClient{entries: []Entry{{Path: "/library/A.epub"}, {Path: "/library/B.pdf"}}}
	svc := NewService(store, client, key, booksStore, nil)
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

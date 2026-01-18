package books

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/testutil"
)

func TestPostgresStoreUpsertList(t *testing.T) {
	pool := testutil.OpenTestPool(t)
	store := NewPostgresStore(pool)
	if err := store.EnsureSchema(context.Background()); err != nil {
		t.Fatalf("ensure schema: %v", err)
	}
	userID := fmt.Sprintf("u-%d", time.Now().UnixNano())
	book := Book{Title: "Sample", Author: "Author", Format: "epub", SourcePath: "/books/sample.epub"}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM books WHERE user_id = $1`, userID)
	})
	created, err := store.Upsert(userID, book)
	if err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if created.ID == "" {
		t.Fatalf("expected id")
	}
	list, err := store.ListByUser(userID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 book, got %d", len(list))
	}
	if err := store.MarkMissing(userID, []string{book.SourcePath}); err != nil {
		t.Fatalf("mark missing: %v", err)
	}
	updated, err := store.GetBySourcePath(userID, book.SourcePath)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !updated.Missing {
		t.Fatalf("expected missing true")
	}
}

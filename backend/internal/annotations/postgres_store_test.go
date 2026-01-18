package annotations

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/testutil"
)

func TestPostgresStoreCRUD(t *testing.T) {
	pool := testutil.OpenTestPool(t)
	store := NewPostgresStore(pool)
	if err := store.EnsureSchema(context.Background()); err != nil {
		t.Fatalf("ensure schema: %v", err)
	}
	userID := fmt.Sprintf("u-%d", time.Now().UnixNano())
	bookID := "book-1"
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM annotations WHERE user_id = $1`, userID)
	})
	created, err := store.Create(userID, bookID, 0.5, "quote", "note", "#ffcc00")
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	list, err := store.ListByBook(userID, bookID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 annotation, got %d", len(list))
	}
	if list[0].ID != created.ID {
		t.Fatalf("expected id %s, got %s", created.ID, list[0].ID)
	}
	if err := store.Delete(userID, bookID, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
}

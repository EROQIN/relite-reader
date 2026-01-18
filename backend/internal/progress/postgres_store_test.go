package progress

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/testutil"
)

func TestPostgresStoreSaveGet(t *testing.T) {
	pool := testutil.OpenTestPool(t)
	store := NewPostgresStore(pool)
	if err := store.EnsureSchema(context.Background()); err != nil {
		t.Fatalf("ensure schema: %v", err)
	}
	userID := fmt.Sprintf("u-%d", time.Now().UnixNano())
	bookID := "book-1"
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM reading_progress WHERE user_id = $1`, userID)
	})
	if _, err := store.Save(userID, bookID, 0.4); err != nil {
		t.Fatalf("save: %v", err)
	}
	loaded, err := store.Get(userID, bookID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if loaded.Location != 0.4 {
		t.Fatalf("expected location 0.4")
	}
}

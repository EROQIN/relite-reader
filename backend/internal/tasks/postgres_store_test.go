package tasks

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
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM tasks WHERE user_id = $1`, userID)
	})
	created, err := store.Create(Task{UserID: userID, Type: "format", Status: StatusQueued})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	created.Status = StatusRunning
	if err := store.Update(created); err != nil {
		t.Fatalf("update: %v", err)
	}
	list, err := store.ListByUser(userID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) == 0 {
		t.Fatalf("expected tasks")
	}
}

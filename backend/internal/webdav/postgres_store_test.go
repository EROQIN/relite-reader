package webdav

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
		_, _ = pool.Exec(context.Background(), `DELETE FROM webdav_connections WHERE user_id = $1`, userID)
	})
	conn := Connection{BaseURL: "https://dav.example.com", Username: "reader", EncryptedSecret: []byte("secret"), LastSyncStatus: "never"}
	created, err := store.Create(userID, conn)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	list, err := store.ListByUser(userID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 connection, got %d", len(list))
	}
	if _, err := store.UpdateSyncStatus(userID, created.ID, "success", ""); err != nil {
		t.Fatalf("update sync: %v", err)
	}
	if err := store.Delete(userID, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
}

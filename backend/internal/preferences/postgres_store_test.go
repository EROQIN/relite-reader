package preferences

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
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM user_preferences WHERE user_id = $1`, userID)
	})
	prefs := DefaultUserPreferences()
	prefs.Locale = "zh-CN"
	prefs.Reader.FontSize = 20
	if _, err := store.Save(userID, prefs); err != nil {
		t.Fatalf("save: %v", err)
	}
	loaded, err := store.Get(userID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if loaded.Locale != "zh-CN" {
		t.Fatalf("expected locale zh-CN")
	}
	if loaded.Reader.FontSize != 20 {
		t.Fatalf("expected font size 20")
	}
}

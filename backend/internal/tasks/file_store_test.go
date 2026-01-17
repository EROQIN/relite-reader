package tasks

import (
	"path/filepath"
	"testing"
)

func TestFileStorePersists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "tasks.json")
	store, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, err = store.Create(Task{UserID: "user-1", Type: "format", Status: StatusQueued})
	if err != nil {
		t.Fatalf("create error: %v", err)
	}

	reloaded, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("reload error: %v", err)
	}
	list, _ := reloaded.ListByUser("user-1")
	if len(list) != 1 {
		t.Fatalf("expected 1 task, got %d", len(list))
	}
}

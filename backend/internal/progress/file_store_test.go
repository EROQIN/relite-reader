package progress

import (
	"path/filepath"
	"testing"
)

func TestFileStorePersists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "progress.json")
	store, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, err = store.Save("user-1", "book-1", 0.42)
	if err != nil {
		t.Fatalf("save error: %v", err)
	}

	reloaded, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("reload error: %v", err)
	}
	progress, _ := reloaded.Get("user-1", "book-1")
	if progress.Location != 0.42 {
		t.Fatalf("expected 0.42, got %f", progress.Location)
	}
}

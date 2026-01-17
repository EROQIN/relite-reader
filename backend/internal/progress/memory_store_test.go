package progress

import "testing"

func TestMemoryStoreDefaults(t *testing.T) {
	store := NewMemoryStore()
	progress, err := store.Get("user-1", "book-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if progress.Location != 0 {
		t.Fatalf("expected 0, got %f", progress.Location)
	}
}

func TestMemoryStoreSave(t *testing.T) {
	store := NewMemoryStore()
	progress, err := store.Save("user-1", "book-1", 0.6)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if progress.Location != 0.6 {
		t.Fatalf("expected 0.6, got %f", progress.Location)
	}
}

package bookmarks

import "testing"

func TestMemoryStoreCRUD(t *testing.T) {
	store := NewMemoryStore()
	created, err := store.Create("user-1", "book-1", "Intro", 0.2)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	list, _ := store.ListByBook("user-1", "book-1")
	if len(list) != 1 {
		t.Fatalf("expected 1, got %d", len(list))
	}
	if err := store.Delete("user-1", "book-1", created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
}

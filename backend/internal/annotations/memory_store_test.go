package annotations

import "testing"

func TestMemoryStoreCRUD(t *testing.T) {
	store := NewMemoryStore()
	created, err := store.Create("user-1", "book-1", 0.42, "quote", "note", "#ffcc00")
	if err != nil {
		t.Fatalf("create failed: %v", err)
	}
	items, err := store.ListByBook("user-1", "book-1")
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 annotation, got %d", len(items))
	}
	if items[0].ID != created.ID {
		t.Fatalf("expected id %s, got %s", created.ID, items[0].ID)
	}
	if err := store.Delete("user-1", "book-1", created.ID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	items, _ = store.ListByBook("user-1", "book-1")
	if len(items) != 0 {
		t.Fatalf("expected empty list after delete")
	}
}

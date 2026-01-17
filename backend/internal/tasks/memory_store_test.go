package tasks

import "testing"

func TestMemoryStoreCreateAndList(t *testing.T) {
	store := NewMemoryStore()
	created, err := store.Create(Task{UserID: "user-1", Type: "format", Status: StatusQueued})
	if err != nil {
		t.Fatalf("create error: %v", err)
	}
	if created.ID == "" {
		t.Fatalf("expected id")
	}
	list, _ := store.ListByUser("user-1")
	if len(list) != 1 {
		t.Fatalf("expected 1 task, got %d", len(list))
	}
}

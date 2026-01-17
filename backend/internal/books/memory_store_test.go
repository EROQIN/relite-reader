package books

import "testing"

func TestMemoryStoreUpsertAndMarkMissing(t *testing.T) {
	store := NewMemoryStore()
	_, err := store.Upsert("user-1", Book{SourcePath: "/a.epub", Title: "A", Format: "epub"})
	if err != nil {
		t.Fatalf("upsert: %v", err)
	}
	_, err = store.Upsert("user-1", Book{SourcePath: "/b.pdf", Title: "B", Format: "pdf"})
	if err != nil {
		t.Fatalf("upsert: %v", err)
	}
	list, _ := store.ListByUser("user-1")
	if len(list) != 2 {
		t.Fatalf("expected 2 books, got %d", len(list))
	}
	if err := store.MarkMissing("user-1", []string{"/b.pdf"}); err != nil {
		t.Fatalf("mark missing: %v", err)
	}
	missing, err := store.GetBySourcePath("user-1", "/b.pdf")
	if err != nil {
		t.Fatalf("get by source path: %v", err)
	}
	if !missing.Missing {
		t.Fatalf("expected missing to be true")
	}
}

package webdav

import "testing"

func TestMemoryStoreCRUD(t *testing.T) {
	store := NewMemoryStore()
	conn, err := store.Create("user-1", Connection{
		BaseURL:         "https://dav.example.com",
		Username:        "reader",
		EncryptedSecret: []byte("secret"),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatalf("expected id")
	}
	list, _ := store.ListByUser("user-1")
	if len(list) != 1 {
		t.Fatalf("expected 1 connection, got %d", len(list))
	}
	conn.BaseURL = "https://dav2.example.com"
	updated, err := store.Update("user-1", conn)
	if err != nil || updated.BaseURL != "https://dav2.example.com" {
		t.Fatalf("update failed")
	}
	if err := store.Delete("user-1", conn.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
}

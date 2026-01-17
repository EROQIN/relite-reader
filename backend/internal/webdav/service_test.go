package webdav

import "testing"

type fakeClient struct {
	err     error
	entries []Entry
}

func (f fakeClient) List(_ string, _ string, _ string) ([]Entry, error) {
	return f.entries, f.err
}

func TestServiceCreateValidatesClient(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key, nil)
	conn, err := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatalf("expected id")
	}
}

func TestServiceSyncUpdatesStatus(t *testing.T) {
	store := NewMemoryStore()
	key, _ := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	svc := NewService(store, fakeClient{err: nil}, key, nil)
	conn, _ := svc.Create("user-1", "https://dav.example.com", "reader", "secret")
	if err := svc.Sync("user-1", conn.ID); err != nil {
		t.Fatalf("sync: %v", err)
	}
	updated, _ := store.GetByID("user-1", conn.ID)
	if updated.LastSyncStatus != "success" {
		t.Fatalf("expected success status")
	}
}

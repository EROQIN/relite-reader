package preferences

import "testing"

func TestMemoryStoreDefaults(t *testing.T) {
	store := NewMemoryStore()
	prefs, err := store.Get("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if prefs.Reader.Theme != "paper" {
		t.Fatalf("expected default theme, got %s", prefs.Reader.Theme)
	}
}

func TestMemoryStoreSave(t *testing.T) {
	store := NewMemoryStore()
	prefs := DefaultUserPreferences()
	prefs.Reader.Theme = "night"
	_, err := store.Save("user-1", prefs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	loaded, _ := store.Get("user-1")
	if loaded.Reader.Theme != "night" {
		t.Fatalf("expected saved theme, got %s", loaded.Reader.Theme)
	}
}

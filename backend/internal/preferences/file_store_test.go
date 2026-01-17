package preferences

import (
	"path/filepath"
	"testing"
)

func TestFileStorePersists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "prefs.json")
	store, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	prefs := DefaultUserPreferences()
	prefs.Reader.Font = "mono"
	if _, err := store.Save("user-1", prefs); err != nil {
		t.Fatalf("save error: %v", err)
	}

	reloaded, err := NewFileStore(path)
	if err != nil {
		t.Fatalf("reload error: %v", err)
	}
	loaded, _ := reloaded.Get("user-1")
	if loaded.Reader.Font != "mono" {
		t.Fatalf("expected persisted font, got %s", loaded.Reader.Font)
	}
}

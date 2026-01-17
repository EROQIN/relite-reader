package preferences

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type FileStore struct {
	mu   sync.RWMutex
	path string
	data map[string]UserPreferences
}

func NewFileStore(path string) (*FileStore, error) {
	store := &FileStore{path: path, data: make(map[string]UserPreferences)}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *FileStore) Get(userID string) (UserPreferences, error) {
	s.mu.RLock()
	prefs, ok := s.data[userID]
	s.mu.RUnlock()
	if !ok {
		return DefaultUserPreferences(), nil
	}
	return prefs, nil
}

func (s *FileStore) Save(userID string, prefs UserPreferences) (UserPreferences, error) {
	s.mu.Lock()
	s.data[userID] = prefs
	err := s.persistLocked()
	s.mu.Unlock()
	if err != nil {
		return UserPreferences{}, err
	}
	return prefs, nil
}

func (s *FileStore) load() error {
	payload, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if len(payload) == 0 {
		return nil
	}
	return json.Unmarshal(payload, &s.data)
}

func (s *FileStore) persistLocked() error {
	payload, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, payload, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func EnsureDir(path string) error {
	return os.MkdirAll(filepath.Dir(path), 0o755)
}

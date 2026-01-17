package progress

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type FileStore struct {
	mu   sync.RWMutex
	path string
	data map[string]map[string]Progress
}

func NewFileStore(path string) (*FileStore, error) {
	store := &FileStore{path: path, data: make(map[string]map[string]Progress)}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *FileStore) Get(userID, bookID string) (Progress, error) {
	s.mu.RLock()
	userMap := s.data[userID]
	progress, ok := userMap[bookID]
	s.mu.RUnlock()
	if !ok {
		return Progress{BookID: bookID, Location: 0, UpdatedAt: time.Time{}}, nil
	}
	return progress, nil
}

func (s *FileStore) Save(userID, bookID string, location float64) (Progress, error) {
	s.mu.Lock()
	if s.data[userID] == nil {
		s.data[userID] = make(map[string]Progress)
	}
	progress := Progress{
		BookID:    bookID,
		Location:  normalizeLocation(location),
		UpdatedAt: time.Now().UTC(),
	}
	s.data[userID][bookID] = progress
	err := s.persistLocked()
	s.mu.Unlock()
	if err != nil {
		return Progress{}, err
	}
	return progress, nil
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

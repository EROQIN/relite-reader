package progress

import (
	"sync"
	"time"
)

type MemoryStore struct {
	mu    sync.RWMutex
	items map[string]map[string]Progress
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Progress)}
}

func (s *MemoryStore) Get(userID, bookID string) (Progress, error) {
	s.mu.RLock()
	userMap := s.items[userID]
	progress, ok := userMap[bookID]
	s.mu.RUnlock()
	if !ok {
		return Progress{BookID: bookID, Location: 0, UpdatedAt: time.Time{}}, nil
	}
	return progress, nil
}

func (s *MemoryStore) Save(userID, bookID string, location float64) (Progress, error) {
	s.mu.Lock()
	if s.items[userID] == nil {
		s.items[userID] = make(map[string]Progress)
	}
	progress := Progress{
		BookID:    bookID,
		Location:  normalizeLocation(location),
		UpdatedAt: time.Now().UTC(),
	}
	s.items[userID][bookID] = progress
	s.mu.Unlock()
	return progress, nil
}

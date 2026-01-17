package preferences

import "sync"

type MemoryStore struct {
	mu    sync.RWMutex
	items map[string]UserPreferences
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]UserPreferences)}
}

func (s *MemoryStore) Get(userID string) (UserPreferences, error) {
	s.mu.RLock()
	prefs, ok := s.items[userID]
	s.mu.RUnlock()
	if !ok {
		return DefaultUserPreferences(), nil
	}
	return prefs, nil
}

func (s *MemoryStore) Save(userID string, prefs UserPreferences) (UserPreferences, error) {
	s.mu.Lock()
	s.items[userID] = prefs
	s.mu.Unlock()
	return prefs, nil
}

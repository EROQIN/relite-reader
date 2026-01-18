package bookmarks

import (
	"fmt"
	"sync"
	"time"
)

type MemoryStore struct {
	mu     sync.Mutex
	items  map[string]map[string][]Bookmark
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string][]Bookmark)}
}

func (s *MemoryStore) Create(userID, bookID, label string, location float64) (Bookmark, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[userID] == nil {
		s.items[userID] = make(map[string][]Bookmark)
	}
	s.nextID++
	bookmark := Bookmark{
		ID:        fmt.Sprintf("bm-%d", s.nextID),
		UserID:    userID,
		BookID:    bookID,
		Label:     label,
		Location:  location,
		CreatedAt: time.Now().UTC(),
	}
	s.items[userID][bookID] = append(s.items[userID][bookID], bookmark)
	return bookmark, nil
}

func (s *MemoryStore) ListByBook(userID, bookID string) ([]Bookmark, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Bookmark{}, s.items[userID][bookID]...), nil
}

func (s *MemoryStore) Delete(userID, bookID, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	list := s.items[userID][bookID]
	for i, item := range list {
		if item.ID == id {
			s.items[userID][bookID] = append(list[:i], list[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
}

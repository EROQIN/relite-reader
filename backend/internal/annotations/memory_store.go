package annotations

import (
	"fmt"
	"sync"
	"time"
)

type MemoryStore struct {
	mu     sync.Mutex
	items  map[string]map[string][]Annotation
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string][]Annotation)}
}

func (s *MemoryStore) Create(userID, bookID string, location float64, quote, note, color string) (Annotation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[userID] == nil {
		s.items[userID] = make(map[string][]Annotation)
	}
	s.nextID++
	item := Annotation{
		ID:        fmt.Sprintf("an-%d", s.nextID),
		UserID:    userID,
		BookID:    bookID,
		Location:  location,
		Quote:     quote,
		Note:      note,
		Color:     color,
		CreatedAt: time.Now().UTC(),
	}
	s.items[userID][bookID] = append(s.items[userID][bookID], item)
	return item, nil
}

func (s *MemoryStore) ListByBook(userID, bookID string) ([]Annotation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Annotation{}, s.items[userID][bookID]...), nil
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

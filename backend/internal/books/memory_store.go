package books

import (
	"fmt"
	"sync"
	"time"
)

type MemoryStore struct {
	mu     sync.Mutex
	items  map[string]map[string]Book
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Book)}
}

func (s *MemoryStore) Upsert(userID string, book Book) (Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[userID] == nil {
		s.items[userID] = make(map[string]Book)
	}
	book.UserID = userID
	book.UpdatedAt = time.Now()
	if existing, ok := s.items[userID][book.SourcePath]; ok {
		book.ID = existing.ID
	} else {
		s.nextID++
		book.ID = fmt.Sprintf("b-%d", s.nextID)
	}
	s.items[userID][book.SourcePath] = book
	return book, nil
}

func (s *MemoryStore) ListByUser(userID string) ([]Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Book
	for _, book := range s.items[userID] {
		out = append(out, book)
	}
	return out, nil
}

func (s *MemoryStore) GetBySourcePath(userID, sourcePath string) (Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	book, ok := s.items[userID][sourcePath]
	if !ok {
		return Book{}, ErrNotFound
	}
	return book, nil
}

func (s *MemoryStore) MarkMissing(userID string, missing []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, path := range missing {
		book, ok := s.items[userID][path]
		if !ok {
			continue
		}
		book.Missing = true
		book.UpdatedAt = time.Now()
		s.items[userID][path] = book
	}
	return nil
}

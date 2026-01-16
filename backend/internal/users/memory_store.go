package users

import (
	"fmt"
	"sync"
)

type MemoryStore struct {
	mu     sync.RWMutex
	users  map[string]User
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{users: make(map[string]User)}
}

func (s *MemoryStore) Create(email, passwordHash string) (User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.users[email]; exists {
		return User{}, ErrEmailTaken
	}
	s.nextID++
	user := User{ID: fmt.Sprintf("u-%d", s.nextID), Email: email, PasswordHash: passwordHash}
	s.users[email] = user
	return user, nil
}

func (s *MemoryStore) FindByEmail(email string) (User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, ok := s.users[email]
	if !ok {
		return User{}, ErrNotFound
	}
	return user, nil
}

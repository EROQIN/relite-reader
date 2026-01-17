package tasks

import (
	"errors"
	"sync"
	"time"
)

var ErrNotFound = errors.New("task not found")

type MemoryStore struct {
	mu    sync.Mutex
	items map[string]map[string]Task
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Task)}
}

func (s *MemoryStore) Create(task Task) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[task.UserID] == nil {
		s.items[task.UserID] = make(map[string]Task)
	}
	task.ID = newTaskID()
	now := time.Now().UTC()
	task.CreatedAt = now
	task.UpdatedAt = now
	s.items[task.UserID][task.ID] = task
	return task, nil
}

func (s *MemoryStore) Update(task Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[task.UserID] == nil {
		return ErrNotFound
	}
	if _, ok := s.items[task.UserID][task.ID]; !ok {
		return ErrNotFound
	}
	task.UpdatedAt = time.Now().UTC()
	s.items[task.UserID][task.ID] = task
	return nil
}

func (s *MemoryStore) Get(userID, id string) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.items[userID][id]
	if !ok {
		return Task{}, ErrNotFound
	}
	return item, nil
}

func (s *MemoryStore) ListByUser(userID string) ([]Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Task
	for _, task := range s.items[userID] {
		out = append(out, task)
	}
	return out, nil
}

package tasks

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type FileStore struct {
	mu    sync.Mutex
	path  string
	items map[string]map[string]Task
}

func NewFileStore(path string) (*FileStore, error) {
	store := &FileStore{path: path, items: make(map[string]map[string]Task)}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *FileStore) Create(task Task) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.items[task.UserID] == nil {
		s.items[task.UserID] = make(map[string]Task)
	}
	if task.ID == "" {
		task.ID = newTaskID()
	}
	now := time.Now().UTC()
	task.CreatedAt = now
	task.UpdatedAt = now
	s.items[task.UserID][task.ID] = task
	if err := s.persistLocked(); err != nil {
		return Task{}, err
	}
	return task, nil
}

func (s *FileStore) Update(task Task) error {
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
	return s.persistLocked()
}

func (s *FileStore) Get(userID, id string) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.items[userID][id]
	if !ok {
		return Task{}, ErrNotFound
	}
	return item, nil
}

func (s *FileStore) ListByUser(userID string) ([]Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Task
	for _, task := range s.items[userID] {
		out = append(out, task)
	}
	return out, nil
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
	return json.Unmarshal(payload, &s.items)
}

func (s *FileStore) persistLocked() error {
	payload, err := json.MarshalIndent(s.items, "", "  ")
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

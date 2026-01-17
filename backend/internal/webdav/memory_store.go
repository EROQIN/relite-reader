package webdav

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
)

type MemoryStore struct {
	mu    sync.Mutex
	items map[string]map[string]Connection
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]map[string]Connection)}
}

func (s *MemoryStore) Create(userID string, conn Connection) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn.ID = newID()
	conn.UserID = userID
	if s.items[userID] == nil {
		s.items[userID] = make(map[string]Connection)
	}
	s.items[userID][conn.ID] = conn
	return conn, nil
}

func (s *MemoryStore) ListByUser(userID string) ([]Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Connection
	for _, conn := range s.items[userID] {
		out = append(out, conn)
	}
	return out, nil
}

func (s *MemoryStore) GetByID(userID, id string) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn, ok := s.items[userID][id]
	if !ok {
		return Connection{}, ErrNotFound
	}
	return conn, nil
}

func (s *MemoryStore) Update(userID string, conn Connection) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[userID][conn.ID]; !ok {
		return Connection{}, ErrNotFound
	}
	s.items[userID][conn.ID] = conn
	return conn, nil
}

func (s *MemoryStore) Delete(userID, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[userID][id]; !ok {
		return ErrNotFound
	}
	delete(s.items[userID], id)
	return nil
}

func (s *MemoryStore) UpdateSyncStatus(userID, id, status, lastError string) (Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conn, ok := s.items[userID][id]
	if !ok {
		return Connection{}, ErrNotFound
	}
	conn.LastSyncStatus = status
	conn.LastError = lastError
	s.items[userID][id] = conn
	return conn, nil
}

func newID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}

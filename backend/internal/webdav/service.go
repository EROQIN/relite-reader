package webdav

import (
	"errors"

	"github.com/EROQIN/relite-reader/backend/internal/books"
)

type Service struct {
	store  Store
	client Client
	key    []byte
	books  books.Store
}

func NewService(store Store, client Client, key []byte, booksStore books.Store) *Service {
	return &Service{store: store, client: client, key: key, books: booksStore}
}

func (s *Service) Create(userID, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if _, err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	encrypted, err := EncryptSecret(s.key, secret)
	if err != nil {
		return Connection{}, err
	}
	return s.store.Create(userID, Connection{
		BaseURL:         baseURL,
		Username:        username,
		EncryptedSecret: encrypted,
		LastSyncStatus:  "never",
	})
}

func (s *Service) List(userID string) ([]Connection, error) {
	return s.store.ListByUser(userID)
}

func (s *Service) Update(userID, id, baseURL, username, secret string) (Connection, error) {
	if baseURL == "" || username == "" || secret == "" {
		return Connection{}, errors.New("invalid payload")
	}
	if _, err := s.client.List(baseURL, username, secret); err != nil {
		return Connection{}, err
	}
	encrypted, err := EncryptSecret(s.key, secret)
	if err != nil {
		return Connection{}, err
	}
	conn, err := s.store.GetByID(userID, id)
	if err != nil {
		return Connection{}, err
	}
	conn.BaseURL = baseURL
	conn.Username = username
	conn.EncryptedSecret = encrypted
	return s.store.Update(userID, conn)
}

func (s *Service) Delete(userID, id string) error {
	return s.store.Delete(userID, id)
}

func (s *Service) Sync(userID, id string) error {
	conn, err := s.store.GetByID(userID, id)
	if err != nil {
		return err
	}
	secret, err := DecryptSecret(s.key, conn.EncryptedSecret)
	if err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "decrypt failed")
		return err
	}
	if _, err := s.client.List(conn.BaseURL, conn.Username, secret); err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "sync failed")
		return err
	}
	_, err = s.store.UpdateSyncStatus(userID, id, "success", "")
	return err
}

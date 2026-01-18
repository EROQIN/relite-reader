package webdav

import (
	"errors"
	"io"
	"path"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/formats"
	"github.com/EROQIN/relite-reader/backend/internal/tasks"
)

type Service struct {
	store  Store
	client Client
	key    []byte
	books  books.Store
	queue  *tasks.Queue
}

func NewService(store Store, client Client, key []byte, booksStore books.Store, queue *tasks.Queue) *Service {
	return &Service{store: store, client: client, key: key, books: booksStore, queue: queue}
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
	entries, err := s.client.List(conn.BaseURL, conn.Username, secret)
	if err != nil {
		_, _ = s.store.UpdateSyncStatus(userID, id, "error", "sync failed")
		return err
	}
	if s.books != nil {
		present := make(map[string]struct{})
		for _, entry := range entries {
			present[entry.Path] = struct{}{}
			_ = s.upsertBookFromEntry(userID, id, entry)
		}
		missing := s.computeMissing(userID, present)
		_ = s.books.MarkMissing(userID, missing)
	}
	_, err = s.store.UpdateSyncStatus(userID, id, "success", "")
	return err
}

func (s *Service) SyncAll() error {
	conns, err := s.store.ListAll()
	if err != nil {
		return err
	}
	var lastErr error
	for _, conn := range conns {
		if err := s.Sync(conn.UserID, conn.ID); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

func (s *Service) upsertBookFromEntry(userID, connectionID string, entry Entry) error {
	if s.books == nil {
		return nil
	}
	base := path.Base(entry.Path)
	ext := strings.ToLower(path.Ext(base))
	title := strings.TrimSuffix(base, ext)
	format, ok := formats.Detect(entry.Path)
	if !ok {
		format = strings.TrimPrefix(ext, ".")
	}
	book, err := s.books.Upsert(userID, books.Book{
		Title:        title,
		Format:       format,
		SourcePath:   entry.Path,
		ConnectionID: connectionID,
	})
	if err != nil {
		return err
	}
	if s.queue != nil {
		_, _ = s.queue.Enqueue(userID, "format", map[string]string{
			"book_id":    book.ID,
			"format":     format,
			"sourcePath": entry.Path,
		})
	}
	return nil
}

func (s *Service) computeMissing(userID string, present map[string]struct{}) []string {
	if s.books == nil {
		return nil
	}
	list, err := s.books.ListByUser(userID)
	if err != nil {
		return nil
	}
	var missing []string
	for _, book := range list {
		if _, ok := present[book.SourcePath]; !ok {
			missing = append(missing, book.SourcePath)
		}
	}
	return missing
}

func (s *Service) OpenContent(userID, bookID string) (io.ReadCloser, string, error) {
	if s.books == nil {
		return nil, "", errors.New("missing books store")
	}
	book, err := s.books.GetByID(userID, bookID)
	if err != nil {
		return nil, "", err
	}
	if book.ConnectionID == "" {
		return nil, "", errors.New("missing connection")
	}
	conn, err := s.store.GetByID(userID, book.ConnectionID)
	if err != nil {
		return nil, "", err
	}
	secret, err := DecryptSecret(s.key, conn.EncryptedSecret)
	if err != nil {
		return nil, "", err
	}
	return s.client.Fetch(conn.BaseURL, conn.Username, secret, book.SourcePath)
}

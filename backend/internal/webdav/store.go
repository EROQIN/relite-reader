package webdav

import "errors"

var ErrNotFound = errors.New("webdav connection not found")

type Connection struct {
	ID              string
	UserID          string
	BaseURL         string
	Username        string
	EncryptedSecret []byte
	LastSyncStatus  string
	LastError       string
}

type Store interface {
	Create(userID string, conn Connection) (Connection, error)
	ListByUser(userID string) ([]Connection, error)
	GetByID(userID, id string) (Connection, error)
	Update(userID string, conn Connection) (Connection, error)
	Delete(userID, id string) error
	UpdateSyncStatus(userID, id, status, lastError string) (Connection, error)
}

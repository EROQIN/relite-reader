package books

import (
	"errors"
	"time"
)

type Book struct {
	ID         string
	UserID     string
	Title      string
	Author     string
	Format     string
	SourcePath string
	Missing    bool
	UpdatedAt  time.Time
}

var ErrNotFound = errors.New("book not found")

type Store interface {
	Upsert(userID string, book Book) (Book, error)
	ListByUser(userID string) ([]Book, error)
	GetBySourcePath(userID, sourcePath string) (Book, error)
	MarkMissing(userID string, missing []string) error
}

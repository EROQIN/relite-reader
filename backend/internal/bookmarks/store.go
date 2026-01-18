package bookmarks

import "errors"

var ErrNotFound = errors.New("bookmark not found")

// Store persists bookmarks.
type Store interface {
	Create(userID, bookID, label string, location float64) (Bookmark, error)
	ListByBook(userID, bookID string) ([]Bookmark, error)
	Delete(userID, bookID, id string) error
}

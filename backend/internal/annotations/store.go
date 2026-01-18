package annotations

import "errors"

var ErrNotFound = errors.New("annotation not found")

// Store persists annotations.
type Store interface {
	Create(userID, bookID string, location float64, quote, note, color string) (Annotation, error)
	ListByBook(userID, bookID string) ([]Annotation, error)
	Delete(userID, bookID, id string) error
}

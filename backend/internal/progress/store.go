package progress

// Store persists reading progress per user/book.
type Store interface {
	Get(userID, bookID string) (Progress, error)
	Save(userID, bookID string, location float64) (Progress, error)
}

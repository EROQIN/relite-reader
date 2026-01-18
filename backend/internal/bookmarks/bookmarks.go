package bookmarks

import "time"

type Bookmark struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	BookID    string    `json:"book_id"`
	Label     string    `json:"label"`
	Location  float64   `json:"location"`
	CreatedAt time.Time `json:"created_at"`
}

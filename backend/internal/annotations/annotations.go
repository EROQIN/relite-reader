package annotations

import "time"

type Annotation struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	BookID    string    `json:"book_id"`
	Location  float64   `json:"location"`
	Quote     string    `json:"quote"`
	Note      string    `json:"note"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

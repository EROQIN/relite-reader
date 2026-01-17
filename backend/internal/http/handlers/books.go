package handlers

import (
	"net/http"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/books"
)

type BooksHandler struct {
	secret []byte
	store  books.Store
}

type booksResponse struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Author     string    `json:"author"`
	Format     string    `json:"format"`
	SourcePath string    `json:"source_path"`
	Missing    bool      `json:"missing"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func NewBooksHandler(secret []byte, store books.Store) *BooksHandler {
	return &BooksHandler{secret: secret, store: store}
}

func (h *BooksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if r.Method != http.MethodGet || r.URL.Path != "/api/books" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	list, err := h.store.ListByUser(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	resp := make([]booksResponse, 0, len(list))
	for _, book := range list {
		resp = append(resp, booksResponse{
			ID:         book.ID,
			Title:      book.Title,
			Author:     book.Author,
			Format:     book.Format,
			SourcePath: book.SourcePath,
			Missing:    book.Missing,
			UpdatedAt:  book.UpdatedAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

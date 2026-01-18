package handlers

import (
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type BooksHandler struct {
	secret []byte
	store  books.Store
	webSvc *webdav.Service
}

type booksResponse struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Author       string    `json:"author"`
	Format       string    `json:"format"`
	SourcePath   string    `json:"source_path"`
	ConnectionID string    `json:"connection_id"`
	Missing      bool      `json:"missing"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func NewBooksHandler(secret []byte, store books.Store, webSvc *webdav.Service) *BooksHandler {
	return &BooksHandler{secret: secret, store: store, webSvc: webSvc}
}

func (h *BooksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if r.Method == http.MethodGet && r.URL.Path == "/api/books" {
		h.handleList(w, r, userID)
		return
	}
	if r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/api/books/") {
		h.handleContent(w, r, userID)
		return
	}
	w.WriteHeader(http.StatusNotFound)
}

func (h *BooksHandler) handleList(w http.ResponseWriter, r *http.Request, userID string) {
	list, err := h.store.ListByUser(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	resp := make([]booksResponse, 0, len(list))
	for _, book := range list {
		resp = append(resp, booksResponse{
			ID:           book.ID,
			Title:        book.Title,
			Author:       book.Author,
			Format:       book.Format,
			SourcePath:   book.SourcePath,
			ConnectionID: book.ConnectionID,
			Missing:      book.Missing,
			UpdatedAt:    book.UpdatedAt,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *BooksHandler) handleContent(w http.ResponseWriter, r *http.Request, userID string) {
	if h.webSvc == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/books/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[1] != "content" || parts[0] == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	reader, contentType, err := h.webSvc.OpenContent(userID, parts[0])
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	defer reader.Close()
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	_, _ = io.Copy(w, reader)
}

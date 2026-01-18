package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/bookmarks"
)

type BookmarksHandler struct {
	secret []byte
	store  bookmarks.Store
}

type bookmarkPayload struct {
	Label    string  `json:"label"`
	Location float64 `json:"location"`
}

func NewBookmarksHandler(secret []byte, store bookmarks.Store) *BookmarksHandler {
	return &BookmarksHandler{secret: secret, store: store}
}

func (h *BookmarksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/bookmarks/") {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/bookmarks/")
	parts := strings.Split(path, "/")
	bookID := parts[0]
	if bookID == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.handleList(w, r, userID, bookID)
	case http.MethodPost:
		h.handleCreate(w, r, userID, bookID)
	case http.MethodDelete:
		if len(parts) < 2 || parts[1] == "" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		h.handleDelete(w, r, userID, bookID, parts[1])
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *BookmarksHandler) handleList(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	items, err := h.store.ListByBook(userID, bookID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *BookmarksHandler) handleCreate(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	var payload bookmarkPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	item, err := h.store.Create(userID, bookID, payload.Label, payload.Location)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *BookmarksHandler) handleDelete(w http.ResponseWriter, r *http.Request, userID, bookID, id string) {
	if err := h.store.Delete(userID, bookID, id); err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

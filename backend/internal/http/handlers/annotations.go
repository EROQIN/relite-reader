package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/annotations"
)

type AnnotationsHandler struct {
	secret []byte
	store  annotations.Store
}

type annotationPayload struct {
	Location float64 `json:"location"`
	Quote    string  `json:"quote"`
	Note     string  `json:"note"`
	Color    string  `json:"color"`
}

func NewAnnotationsHandler(secret []byte, store annotations.Store) *AnnotationsHandler {
	return &AnnotationsHandler{secret: secret, store: store}
}

func (h *AnnotationsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/annotations/") {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/annotations/")
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

func (h *AnnotationsHandler) handleList(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	items, err := h.store.ListByBook(userID, bookID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *AnnotationsHandler) handleCreate(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	var payload annotationPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	payload.Quote = strings.TrimSpace(payload.Quote)
	payload.Note = strings.TrimSpace(payload.Note)
	payload.Color = strings.TrimSpace(payload.Color)
	if payload.Quote == "" && payload.Note == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	location := normalizeLocation(payload.Location)
	item, err := h.store.Create(userID, bookID, location, payload.Quote, payload.Note, payload.Color)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *AnnotationsHandler) handleDelete(w http.ResponseWriter, r *http.Request, userID, bookID, id string) {
	if err := h.store.Delete(userID, bookID, id); err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func normalizeLocation(value float64) float64 {
	if value < 0 {
		return 0
	}
	if value > 1 {
		return 1
	}
	return value
}

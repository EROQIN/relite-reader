package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/progress"
)

type ProgressHandler struct {
	secret []byte
	store  progress.Store
}

type progressPayload struct {
	Location float64 `json:"location"`
}

func NewProgressHandler(secret []byte, store progress.Store) *ProgressHandler {
	return &ProgressHandler{secret: secret, store: store}
}

func (h *ProgressHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/progress/") {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	bookID := strings.TrimPrefix(r.URL.Path, "/api/progress/")
	if bookID == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.handleGet(w, r, userID, bookID)
	case http.MethodPut:
		h.handlePut(w, r, userID, bookID)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *ProgressHandler) handleGet(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	progressValue, err := h.store.Get(userID, bookID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, progressValue)
}

func (h *ProgressHandler) handlePut(w http.ResponseWriter, r *http.Request, userID, bookID string) {
	var payload progressPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	updated, err := h.store.Save(userID, bookID, payload.Location)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

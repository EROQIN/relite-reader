package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/EROQIN/relite-reader/backend/internal/preferences"
)

type PreferencesHandler struct {
	secret []byte
	store  preferences.Store
}

func NewPreferencesHandler(secret []byte, store preferences.Store) *PreferencesHandler {
	return &PreferencesHandler{secret: secret, store: store}
}

func (h *PreferencesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.handleGet(w, r, userID)
	case http.MethodPut:
		h.handlePut(w, r, userID)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *PreferencesHandler) handleGet(w http.ResponseWriter, r *http.Request, userID string) {
	prefs, err := h.store.Get(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	prefs = preferences.NormalizeUserPreferences(prefs)
	writeJSON(w, http.StatusOK, prefs)
}

func (h *PreferencesHandler) handlePut(w http.ResponseWriter, r *http.Request, userID string) {
	var payload preferences.UserPreferences
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	normalized := preferences.NormalizeUserPreferences(payload)
	prefs, err := h.store.Save(userID, normalized)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, prefs)
}

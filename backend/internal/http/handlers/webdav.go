package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

type WebDAVHandler struct {
	secret []byte
	svc    *webdav.Service
}

type webdavPayload struct {
	BaseURL  string `json:"base_url"`
	Username string `json:"username"`
	Secret   string `json:"secret"`
}

type webdavResponse struct {
	ID             string `json:"id"`
	BaseURL        string `json:"base_url"`
	Username       string `json:"username"`
	LastSyncStatus string `json:"last_sync_status"`
	LastError      string `json:"last_error"`
	LastSyncAt     string `json:"last_sync_at"`
}

func NewWebDAVHandler(secret []byte, svc *webdav.Service) *WebDAVHandler {
	return &WebDAVHandler{secret: secret, svc: svc}
}

func (h *WebDAVHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	switch {
	case r.URL.Path == "/api/webdav":
		switch r.Method {
		case http.MethodGet:
			h.handleList(w, r, userID)
		case http.MethodPost:
			h.handleCreate(w, r, userID)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	case strings.HasPrefix(r.URL.Path, "/api/webdav/"):
		h.handleItem(w, r, userID)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func (h *WebDAVHandler) handleCreate(w http.ResponseWriter, r *http.Request, userID string) {
	var payload webdavPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	conn, err := h.svc.Create(userID, payload.BaseURL, payload.Username, payload.Secret)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusCreated, toWebDAVResponse(conn))
}

func (h *WebDAVHandler) handleList(w http.ResponseWriter, r *http.Request, userID string) {
	conns, err := h.svc.List(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var resp []webdavResponse
	for _, conn := range conns {
		resp = append(resp, toWebDAVResponse(conn))
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *WebDAVHandler) handleItem(w http.ResponseWriter, r *http.Request, userID string) {
	path := strings.TrimPrefix(r.URL.Path, "/api/webdav/")
	parts := strings.Split(path, "/")
	id := parts[0]
	if id == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if len(parts) == 2 && parts[1] == "sync" && r.Method == http.MethodPost {
		_ = h.svc.Sync(userID, id)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	switch r.Method {
	case http.MethodPut:
		var payload webdavPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		conn, err := h.svc.Update(userID, id, payload.BaseURL, payload.Username, payload.Secret)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		writeJSON(w, http.StatusOK, toWebDAVResponse(conn))
	case http.MethodDelete:
		if err := h.svc.Delete(userID, id); err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func toWebDAVResponse(conn webdav.Connection) webdavResponse {
	lastSyncAt := ""
	if !conn.LastSyncAt.IsZero() {
		lastSyncAt = conn.LastSyncAt.UTC().Format(time.RFC3339)
	}
	return webdavResponse{
		ID:             conn.ID,
		BaseURL:        conn.BaseURL,
		Username:       conn.Username,
		LastSyncStatus: conn.LastSyncStatus,
		LastError:      conn.LastError,
		LastSyncAt:     lastSyncAt,
	}
}

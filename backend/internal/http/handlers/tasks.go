package handlers

import (
	"net/http"

	"github.com/EROQIN/relite-reader/backend/internal/tasks"
)

type TasksHandler struct {
	secret []byte
	store  tasks.Store
}

func NewTasksHandler(secret []byte, store tasks.Store) *TasksHandler {
	return &TasksHandler{secret: secret, store: store}
}

func (h *TasksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if r.URL.Path != "/api/tasks" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	items, err := h.store.ListByUser(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

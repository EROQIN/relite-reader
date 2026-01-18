package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/tasks"
)

type TasksHandler struct {
	secret []byte
	store  tasks.Store
	queue  *tasks.Queue
}

func NewTasksHandler(secret []byte, store tasks.Store, queue *tasks.Queue) *TasksHandler {
	return &TasksHandler{secret: secret, store: store, queue: queue}
}

func (h *TasksHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(r, h.secret)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if r.URL.Path == "/api/tasks" {
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
		return
	}
	if !strings.HasPrefix(r.URL.Path, "/api/tasks/") {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	trimmed := strings.TrimPrefix(r.URL.Path, "/api/tasks/")
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 || parts[1] != "retry" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if h.queue == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	task, err := h.store.Get(userID, parts[0])
	if err != nil {
		if errors.Is(err, tasks.ErrNotFound) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	created, err := h.queue.Enqueue(userID, task.Type, task.Payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

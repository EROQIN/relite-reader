package http

import (
	"net/http"

	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
)

func NewRouter() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handlers.Health)
	return mux
}

package http

import (
	"net/http"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

func NewRouter() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handlers.Health)
	return mux
}

func NewRouterWithAuth(svc *auth.Service, secret []byte) http.Handler {
	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(svc, secret)
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	return mux
}

func NewRouterWithAuthAndWebDAV(svc *auth.Service, secret []byte, webSvc *webdav.Service, booksStore books.Store) http.Handler {
	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(svc, secret)
	webHandler := handlers.NewWebDAVHandler(secret, webSvc)
	booksHandler := handlers.NewBooksHandler(secret, booksStore)
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.Handle("/api/webdav", webHandler)
	mux.Handle("/api/webdav/", webHandler)
	mux.Handle("/api/books", booksHandler)
	return mux
}

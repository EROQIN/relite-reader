package http

import (
	"net/http"

	"github.com/EROQIN/relite-reader/backend/internal/annotations"
	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/bookmarks"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	"github.com/EROQIN/relite-reader/backend/internal/http/handlers"
	"github.com/EROQIN/relite-reader/backend/internal/preferences"
	"github.com/EROQIN/relite-reader/backend/internal/progress"
	"github.com/EROQIN/relite-reader/backend/internal/tasks"
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

func NewRouterWithAuthAndWebDAV(
	svc *auth.Service,
	secret []byte,
	webSvc *webdav.Service,
	booksStore books.Store,
	annotationsStore annotations.Store,
	bookmarksStore bookmarks.Store,
	prefsStore preferences.Store,
	progressStore progress.Store,
	tasksStore tasks.Store,
	queue *tasks.Queue,
) http.Handler {
	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(svc, secret)
	webHandler := handlers.NewWebDAVHandler(secret, webSvc)
	booksHandler := handlers.NewBooksHandler(secret, booksStore)
	annotationsHandler := handlers.NewAnnotationsHandler(secret, annotationsStore)
	bookmarksHandler := handlers.NewBookmarksHandler(secret, bookmarksStore)
	prefsHandler := handlers.NewPreferencesHandler(secret, prefsStore)
	progressHandler := handlers.NewProgressHandler(secret, progressStore)
	tasksHandler := handlers.NewTasksHandler(secret, tasksStore, queue)
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.Handle("/api/webdav", webHandler)
	mux.Handle("/api/webdav/", webHandler)
	mux.Handle("/api/books", booksHandler)
	mux.Handle("/api/annotations/", annotationsHandler)
	mux.Handle("/api/bookmarks/", bookmarksHandler)
	mux.Handle("/api/preferences", prefsHandler)
	mux.Handle("/api/progress/", progressHandler)
	mux.Handle("/api/tasks", tasksHandler)
	mux.Handle("/api/tasks/", tasksHandler)
	return mux
}

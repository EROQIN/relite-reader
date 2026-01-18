package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/annotations"
	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/bookmarks"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/preferences"
	"github.com/EROQIN/relite-reader/backend/internal/progress"
	"github.com/EROQIN/relite-reader/backend/internal/tasks"
	"github.com/EROQIN/relite-reader/backend/internal/users"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	jwtSecret := []byte(os.Getenv("RELITE_JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Fatal("missing RELITE_JWT_SECRET")
	}
	key, err := webdav.ParseKey(os.Getenv("RELITE_WEB_DAV_KEY"))
	if err != nil {
		log.Fatal("invalid RELITE_WEB_DAV_KEY")
	}
	var userStore users.Store = users.NewMemoryStore()
	var pgPool *pgxpool.Pool
	if dsn := os.Getenv("RELITE_DATABASE_URL"); dsn != "" {
		pgStore, err := users.NewPostgresStore(context.Background(), dsn)
		if err != nil {
			log.Fatal(err)
		}
		if err := pgStore.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		defer pgStore.Close()
		userStore = pgStore
		pgPool = pgStore.Pool()
	}
	authSvc := auth.NewService(userStore)
	var bookStore books.Store = books.NewMemoryStore()
	var annotationsStore annotations.Store = annotations.NewMemoryStore()
	var bookmarksStore bookmarks.Store = bookmarks.NewMemoryStore()
	var prefsStore preferences.Store = preferences.NewMemoryStore()
	var progressStore progress.Store = progress.NewMemoryStore()
	var tasksStore tasks.Store = tasks.NewMemoryStore()
	if pgPool != nil {
		pgBooks := books.NewPostgresStore(pgPool)
		if err := pgBooks.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		bookStore = pgBooks
		pgAnnotations := annotations.NewPostgresStore(pgPool)
		if err := pgAnnotations.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		annotationsStore = pgAnnotations
		pgPrefs := preferences.NewPostgresStore(pgPool)
		if err := pgPrefs.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		prefsStore = pgPrefs
		pgProgress := progress.NewPostgresStore(pgPool)
		if err := pgProgress.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		progressStore = pgProgress
		pgBookmarks := bookmarks.NewPostgresStore(pgPool)
		if err := pgBookmarks.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		bookmarksStore = pgBookmarks
		pgTasks := tasks.NewPostgresStore(pgPool)
		if err := pgTasks.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		tasksStore = pgTasks
	}
	if dataDir := os.Getenv("RELITE_DATA_DIR"); dataDir != "" {
		path := filepath.Join(dataDir, "preferences.json")
		if err := preferences.EnsureDir(path); err != nil {
			log.Fatal(err)
		}
		fileStore, err := preferences.NewFileStore(path)
		if err != nil {
			log.Fatal(err)
		}
		if pgPool == nil {
			prefsStore = fileStore
		}
		progressPath := filepath.Join(dataDir, "progress.json")
		if err := progress.EnsureDir(progressPath); err != nil {
			log.Fatal(err)
		}
		progressFile, err := progress.NewFileStore(progressPath)
		if err != nil {
			log.Fatal(err)
		}
		if pgPool == nil {
			progressStore = progressFile
		}
		tasksPath := filepath.Join(dataDir, "tasks.json")
		if err := tasks.EnsureDir(tasksPath); err != nil {
			log.Fatal(err)
		}
		tasksFile, err := tasks.NewFileStore(tasksPath)
		if err != nil {
			log.Fatal(err)
		}
		if pgPool == nil {
			tasksStore = tasksFile
		}
	}
	var webStore webdav.Store = webdav.NewMemoryStore()
	if pgPool != nil {
		pgWeb := webdav.NewPostgresStore(pgPool)
		if err := pgWeb.EnsureSchema(context.Background()); err != nil {
			log.Fatal(err)
		}
		webStore = pgWeb
	}
	webClient := webdav.NewHTTPClient(http.DefaultClient)
	queue := tasks.NewQueue(tasksStore, tasks.DefaultHandler, 200)
	webSvc := webdav.NewService(webStore, webClient, key, bookStore, queue)
	interval := 20 * time.Minute
	if raw := os.Getenv("RELITE_WEB_DAV_SYNC_INTERVAL"); raw != "" {
		duration, err := time.ParseDuration(raw)
		if err != nil {
			log.Fatal("invalid RELITE_WEB_DAV_SYNC_INTERVAL")
		}
		interval = duration
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go webdav.NewScheduler(webSvc, ticker.C).Start(ctx)
	queue.Start(ctx)
	srv := &http.Server{
		Addr:    ":8080",
		Handler: apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc, bookStore, annotationsStore, bookmarksStore, prefsStore, progressStore, tasksStore, queue),
	}
	log.Fatal(srv.ListenAndServe())
}
